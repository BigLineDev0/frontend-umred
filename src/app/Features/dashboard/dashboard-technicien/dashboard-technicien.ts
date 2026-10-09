import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';

import { EquipementService } from '../../../Core/services/equipement.service';
import { MaintenanceService } from '../../../Core/services/maintenance.service';
import { MaintenanceFormModal } from '../../maintenances/pages/maintenance-form-modal/maintenance-form-modal';
import { ReservationService } from '../../../Core/services/reservation.service';
import { SignalerPanneModal } from '../../maintenances/pages/signaler-panne-modal/signaler-panne-modal';
import { DatePipe } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DemandeEnAttente } from '../../../Core/models/reservation.model';
import { ConsommableService } from '../../../Core/services/consommable.service';
import { messageErreur } from '../../../Shared/utils/message-erreur';
import { accord } from '../../../Shared/utils/accord';

@Component({
  selector: 'app-dashboard-technicien',
  standalone: true,
  imports: [
    Tag,
    Button,
    TableModule,
    RouterLink,
    PageHeader,
    MiniStatCard,
    MaintenanceFormModal,
    SignalerPanneModal,
    DatePipe,
    ConfirmDialogModule,
  ],
  templateUrl: './dashboard-technicien.html',
  providers: [ConfirmationService],
})
export class DashboardTechnicien implements OnInit {
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  readonly equipementService = inject(EquipementService);
  readonly maintenanceService = inject(MaintenanceService);
  readonly reservationService = inject(ReservationService);
  readonly consommableService = inject(ConsommableService);

  formModalVisible = signal(false);
  panneModalVisible = signal(false);

  // --- KPI ---
  readonly equipementsDisponibles = computed(
    () => this.equipementService.equipements().filter((e) => e.statut === 'DISPONIBLE').length,
  );
  readonly equipementsEnMaintenance = computed(
    () => this.equipementService.equipements().filter((e) => e.statut === 'EN_MAINTENANCE').length,
  );
  readonly equipementsEnPanne = computed(
    () => this.equipementService.equipements().filter((e) => e.statut === 'EN_PANNE').length,
  );
  readonly maintenancesPlanifiees = computed(
    () => this.maintenanceService.maintenances().filter((m) => m.statut === 'PLANIFIEE').length,
  );

  // --- Demandes à valider : aperçu de la file analysée (3 premières), avec
  // la recommandation du serveur ; la page dédiée affiche la file complète.
  readonly file = signal<DemandeEnAttente[]>([]);
  readonly demandesAValider = computed(() => this.file().slice(0, 3));
  readonly actionEnCours = signal<number | null>(null);

  // Alerte usure
  readonly alertesUsure = computed(() => this.equipementService.alertesUsureActives().slice(0, 3));

  readonly alertesConsommables = computed(() => this.consommableService.alertesActives().slice(0, 3));


  // --- Alertes : équipements en panne + maintenances planifiées en retard ---
  readonly equipementsEnPanneListe = computed(() =>
    this.equipementService
      .equipements()
      .filter((e) => e.statut === 'EN_PANNE')
      .slice(0, 2),
  );

  readonly maintenancesEnRetard = computed(() => {
    const maintenant = new Date();
    return this.maintenanceService
      .maintenances()
      .filter((m) => m.statut === 'PLANIFIEE' && new Date(m.date_planifiee) < maintenant)
      .slice(0, 2);
  });

  // --- Prochaines interventions : planifiées à venir, triées par date ---
  readonly prochainesInterventions = computed(() => {
    const maintenant = new Date();
    return this.maintenanceService
      .maintenances()
      .filter((m) => m.statut === 'PLANIFIEE' && new Date(m.date_planifiee) >= maintenant)
      .sort((a, b) => a.date_planifiee.localeCompare(b.date_planifiee))
      .slice(0, 3);
  });

  // --- Historique : interventions en cours ou terminées, les plus récentes ---
  readonly historiqueRecent = computed(() =>
    this.maintenanceService
      .maintenances()
      .filter((m) => m.statut === 'EN_COURS' || m.statut === 'TERMINEE')
      .sort((a, b) =>
        (b.date_fin ?? b.date_debut ?? b.date_creation).localeCompare(
          a.date_fin ?? a.date_debut ?? a.date_creation,
        ),
      )
      .slice(0, 3),
  );

  ngOnInit(): void {
    this.equipementService.charger();
    // Corrigé : l'ancien appel lisait le signal sans jamais charger les alertes.
    this.equipementService.chargerAlertesUsure();
    this.consommableService.chargerAlertes();
    this.maintenanceService.charger();
    this.chargerFile();
  }

  private chargerFile(): void {
    this.reservationService.fileAttente().subscribe({ next: (demandes) => this.file.set(demandes) });
  }

  getMaintenanceStatusLabel(s: string) {
    return (
      { PLANIFIEE: 'Planifiée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' }[
        s
      ] ?? s
    );
  }
  getMaintenanceStatusSeverity(s: string) {
    return (
      ({ PLANIFIEE: 'info', EN_COURS: 'warn', TERMINEE: 'success', ANNULEE: 'secondary' } as const)[
        s
      ] ?? 'info'
    );
  }

  // Toute décision est confirmée : un clic involontaire ne doit pas
  // valider une demande (ni en refuser automatiquement les concurrentes).
  valider(demande: DemandeEnAttente): void {
    this.confirmationService.confirm({
      header: 'Valider la demande',
      message: `Valider la demande de ${demande.demandeur_nom} ?`
        + (demande.analyse.concurrentes ? ` ${accord(demande.analyse.concurrentes, 'demande concurrente sera refusée', 'demandes concurrentes seront refusées')} automatiquement.` : ''),
      acceptLabel: 'Valider', rejectLabel: 'Retour',
      acceptButtonProps: { severity: 'success' }, rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.decider(demande, this.reservationService.valider(demande.id), 'Demande validée'),
    });
  }

  refuser(demande: DemandeEnAttente): void {
    this.confirmationService.confirm({
      header: 'Refuser la demande',
      message: `Refuser la demande de ${demande.demandeur_nom} ? Pour indiquer un motif, utilisez la page « Réservations à valider ».`,
      acceptLabel: 'Refuser', rejectLabel: 'Retour',
      acceptButtonProps: { severity: 'danger' }, rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.decider(demande, this.reservationService.refuser(demande.id), 'Demande refusée'),
    });
  }

  private decider(demande: DemandeEnAttente, requete: ReturnType<ReservationService['valider']>, titre: string): void {
    this.actionEnCours.set(demande.id);
    requete.subscribe({
      next: () => {
        this.actionEnCours.set(null);
        this.messageService.add({ severity: 'success', summary: titre, detail: `Le demandeur (${demande.demandeur_nom}) a été notifié.` });
        this.chargerFile();
      },
      error: (err) => {
        this.actionEnCours.set(null);
        this.messageService.add({
          severity: 'error', summary: 'Action impossible',
          detail: messageErreur(err),
        });
      },
    });
  }

  voirEquipements(): void {
    this.router.navigate(['/equipements']);
  }
}
