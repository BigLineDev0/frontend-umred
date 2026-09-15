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
  ],
  templateUrl: './dashboard-technicien.html',
})
export class DashboardTechnicien implements OnInit {
  private router = inject(Router);

  readonly equipementService = inject(EquipementService);
  readonly maintenanceService = inject(MaintenanceService);
  readonly reservationService = inject(ReservationService);

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

  // --- Demandes à valider : les 3 plus récentes seulement, le dashboard n'est qu'un aperçu ---
  readonly demandesAValider = computed(() => this.reservationService.reservations().slice(0, 3));

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
    this.maintenanceService.charger();
    this.reservationService.charger({ all: true, statut: 'EN_ATTENTE' });
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

  valider(reservationId: number): void {
    this.reservationService.valider(reservationId).subscribe();
  }
  refuser(reservationId: number): void {
    this.reservationService.refuser(reservationId).subscribe();
  }

  voirEquipements(): void {
    this.router.navigate(['/equipements']);
  }
}
