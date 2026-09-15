import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { AuthService } from '../../../../Core/services/auth.service';
import { MaintenanceClotureModal } from '../maintenance-cloture-modal/maintenance-cloture-modal';

interface EtapeHistorique { date: string; libelle: string; }

@Component({
  standalone: true,
  selector: 'app-maintenance-detail',
  templateUrl: './maintenance-detail.html',
  providers: [ConfirmationService],
  imports: [RouterLink, ButtonModule, TagModule, ConfirmDialogModule, DatePipe, MaintenanceClotureModal],
})
export class MaintenanceDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly maintenance = signal<Maintenance | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  clotureModalVisible = signal(false);

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'TECHNICIEN';
  });

  readonly historique = computed<EtapeHistorique[]>(() => {
    const m = this.maintenance();
    if (!m) return [];
    const etapes: EtapeHistorique[] = [{
      date: m.date_creation,
      libelle: m.signale_par_nom ? `Panne signalée par ${m.signale_par_nom}.` : `Maintenance planifiée${m.technicien_nom ? ' par ' + m.technicien_nom : ''}.`,
    }];
    if (m.date_debut) etapes.push({ date: m.date_debut, libelle: 'Intervention démarrée.' });
    if (m.date_fin) etapes.push({ date: m.date_fin, libelle: 'Intervention clôturée.' });
    return etapes;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set('Identifiant invalide.'); this.loading.set(false); return; }
    this.maintenanceService.chargerUne(id).subscribe({
      next: (m) => { this.maintenance.set(m); this.loading.set(false); },
      error: () => { this.error.set('Cette maintenance est introuvable.'); this.loading.set(false); },
    });
  }

  getStatusLabel(s: string) { return { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' }[s] ?? s; }
  getStatusSeverity(s: string) { return ({ PLANIFIEE: 'info', EN_COURS: 'warn', TERMINEE: 'success', ANNULEE: 'secondary' } as const)[s] ?? 'info'; }
  getEquipementStatusLabel(s: string) { return { DISPONIBLE: 'Disponible', RESERVE: 'Réservé', EN_MAINTENANCE: 'En maintenance', EN_PANNE: 'En panne', HORS_SERVICE: 'Hors service' }[s] ?? s; }
  getEquipementStatusSeverity(s: string) { return ({ DISPONIBLE: 'success', RESERVE: 'info', EN_MAINTENANCE: 'warn', EN_PANNE: 'danger', HORS_SERVICE: 'secondary' } as const)[s] ?? 'secondary'; }

  ouvrirCloture(): void { this.clotureModalVisible.set(true); }

  supprimer(): void {
    const m = this.maintenance();
    if (!m) return;
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer cette intervention sur ${m.equipement_nom} ?`,
      header: "Supprimer l'intervention", icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer', rejectLabel: 'Annuler', acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.maintenanceService.supprimer(m.id).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Intervention supprimée.' }); this.router.navigate(['/maintenances']); },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible.' }),
        });
      },
    });
  }
}
