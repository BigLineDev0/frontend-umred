import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ChartModule } from 'primeng/chart';

import { AlerteUsure, Equipement, StatistiquesEquipement, StatutEquipement } from '../../../../Core/models/equipement.model';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';

import QRCode from 'qrcode';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { SignalerPanneModal } from '../../../maintenances/pages/signaler-panne-modal/signaler-panne-modal';
import { couleurTheme } from '../../../../Shared/utils/couleur-theme';
@Component({
  standalone: true,
  selector: 'app-equipement-detail',
  templateUrl: './equipement-detail.html',
  imports: [PageHeader, RouterLink, ButtonModule, TagModule, TableModule, TooltipModule, ConfirmDialogModule, ChartModule, SignalerPanneModal],
  providers: [ConfirmationService],
})
export class EquipementDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly equipementService = inject(EquipementService);
  private readonly laboratoireService = inject(LaboratoireService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);

  readonly maintenanceService = inject(MaintenanceService);

  readonly equipement = signal<Equipement | null>(null);
  readonly laboratoire = signal<{ nom: string; localisation: string } | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  qrCodeUrl = signal<string | null>(null);

  alerteUsure = signal<AlerteUsure | null>(null);
  statistiques = signal<StatistiquesEquipement | null>(null);
  panneModalVisible = signal(false);

  // Utilisation sur 12 mois : réservations (barres) et heures (courbe).
  readonly graphiqueMensuel = computed(() => {
    const stats = this.statistiques();
    if (!stats) return null;
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const primaire = couleurTheme();
    return {
      labels: stats.usage.mensuel.map((m) => mois[Number(m.mois.slice(5, 7)) - 1]),
      datasets: [
        { type: 'bar', label: 'Réservations', data: stats.usage.mensuel.map((m) => m.reservations),
          backgroundColor: primaire, borderRadius: 4, yAxisID: 'y' },
        { type: 'line', label: 'Heures', data: stats.usage.mensuel.map((m) => m.heures),
          borderColor: couleurTheme('--color-primary-light'), backgroundColor: couleurTheme('--color-primary-light'), tension: 0.3, yAxisID: 'y1' },
      ],
    };
  });

  readonly optionsGraphique = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Réservations' } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Heures' } },
    },
  };

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'TECHNICIEN';
  });

  readonly prochaineMaintenance = computed(() =>
    this.maintenanceService.maintenances()
      .filter(m => m.statut === 'PLANIFIEE')
      .sort((a, b) => a.date_planifiee.localeCompare(b.date_planifiee))[0] ?? null
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set("Identifiant de l'équipement invalide.");
      return;
    }
    this.loadEquipement(id);
  }

  private loadEquipement(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.equipementService.chargerUn(id).subscribe({
      next: (e) => {
        this.equipement.set(e);
        this.equipementService.chargerAlerteUsure(e.id).subscribe(a => {
          if (a.niveau) this.alerteUsure.set(a);
        });
        this.equipementService.statistiques(e.id).subscribe({ next: (s) => this.statistiques.set(s) });
        this.genererQrCode(e.id);
        this.loading.set(false);
        this.maintenanceService.chargerParEquipement(id);
        this.laboratoireService.chargerUn(e.laboratoire).subscribe(l =>
          this.laboratoire.set({ nom: l.nom, localisation: l.localisation })
        );
      },
      error: () => {
        this.error.set("L'équipement demandé est introuvable.");
        this.loading.set(false);
      },
    });
  }

  getStatusLabel(status: StatutEquipement): string {
    const labels: Record<StatutEquipement, string> = {
      DISPONIBLE: 'Disponible', RESERVE: 'Réservé', EN_MAINTENANCE: 'En maintenance',
      EN_PANNE: 'En panne', HORS_SERVICE: 'Hors service',
    };
    return labels[status];
  }

  getStatusSeverity(status: StatutEquipement) {
    const severity = {
      DISPONIBLE: 'success', RESERVE: 'info', EN_MAINTENANCE: 'warn',
      EN_PANNE: 'danger', HORS_SERVICE: 'secondary',
    } as const;
    return severity[status];
  }

  getMaintenanceTypeLabel(type: string): string {
    return type === 'PREVENTIVE' ? 'Préventive' : 'Corrective';
  }

  getMaintenanceStatusLabel(statut: string): string {
    const labels: Record<string, string> = { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
    return labels[statut] ?? statut;
  }

  getMaintenanceStatusSeverity(statut: string) {
    const severity: Record<string, 'info' | 'warn' | 'success' | 'secondary'> = {
      PLANIFIEE: 'info', EN_COURS: 'warn', TERMINEE: 'success', ANNULEE: 'secondary',
    };
    return severity[statut] ?? 'info';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
  }

  // Le formulaire de réservation s'ouvre avec ce laboratoire et cet équipement déjà sélectionnés.
  reserver(): void {
    const e = this.equipement();
    if (e) this.router.navigate(['/reservations/ajouter'], { queryParams: { laboratoire: e.laboratoire, equipement: e.id } });
  }

  modifierEquipement(): void {
    const e = this.equipement();
    if (e) this.router.navigate(['/equipements', e.id, 'modifier']);
  }

  supprimerEquipement(): void {
    const e = this.equipement();
    if (!e) return;

    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer « ${e.nom} » ?`,
      header: "Supprimer l'équipement",
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Annuler',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      acceptLabel: 'Supprimer',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.equipementService.supprimer(e.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Équipement supprimé', detail: `« ${e.nom} » a été supprimé.` });
            this.router.navigate(['/equipements']);
          },
          error: (err) => this.messageService.add({
            severity: 'error', summary: 'Suppression impossible', detail: err.error?.detail ?? 'Une erreur est survenue.',
          }),
        });
      },
    });
  }

  private genererQrCode(equipementId: number): void {
    const lienCible = `${window.location.origin}/equipements/${equipementId}`;
    QRCode.toDataURL(lienCible, { width: 300, margin: 2 }).then(dataUrl => {
      this.qrCodeUrl.set(dataUrl);
    });
  }

  telechargerQrCode(): void {
    const url = this.qrCodeUrl();
    const e = this.equipement();
    if (!url || !e) return;
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `qr-${e.numero_serie}.png`;
    lien.click();
  }

  // Corrigé : l'ancien bouton menait vers /maintenances, page réservée aux
  // techniciens et admins ; chercheurs et étudiants ne pouvaient donc pas
  // signaler une panne. Le signalement se fait désormais ici, pour tous.
  signalerPanne(): void {
    this.panneModalVisible.set(true);
  }

  // L'équipement passe EN_PANNE : on recharge sa fiche et son historique.
  apresSignalement(): void {
    const e = this.equipement();
    if (e) this.loadEquipement(e.id);
  }
}
