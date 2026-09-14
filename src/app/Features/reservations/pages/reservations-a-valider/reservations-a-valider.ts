import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { Reservation } from '../../../../Core/models/reservation.model';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { RowActions } from '../../../../Shared/components/row-actions';
import { ReservationDetailModal } from '../../components/reservation-detail-modal/reservation-detail-modal';
import { ReservationService } from '../../../../Core/services/reservatiom.service';

interface FilterValues {
  search: string;
  status: Reservation['statut'] | null;
  laboratoire: number | null;
}

@Component({
  selector: 'app-reservations-a-valider',
  standalone: true,
  templateUrl: './reservations-a-valider.html',
  providers: [ConfirmationService],
  imports: [
    DatePipe,
    FormsModule,
    SelectModule,
    ButtonModule,
    ConfirmDialogModule,
    PageHeader,
    MiniStatCard,
    FilterBar,
    DataTable,
    ColumnTemplateDirective,
    StatusBadge,
    RowActions,
    ReservationDetailModal,
  ],
})
export class ReservationsAValider implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;

  // Seul l'admin voit archiver/supprimer — les deux autres rôles ne
  // peuvent que consulter et valider/refuser.
  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly filters = signal<FilterValues>({ search: '', status: 'EN_ATTENTE', laboratoire: null });

  readonly columns: TableColumn<Reservation>[] = [
    { field: 'demandeur_nom', header: 'Demandeur' },
    { field: 'laboratoire_nom', header: 'Laboratoire' },
    { field: 'equipements_noms', header: 'Équipement(s)' },
    { field: 'date', header: 'Date' },
    { field: 'creneau', header: 'Horaire' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '160px' },
  ];

  readonly statusOptions = [
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Toutes', value: null },
    { label: 'Validée', value: 'VALIDEE' },
    { label: 'Refusée', value: 'REFUSEE' },
    { label: 'Annulée', value: 'ANNULEE' },
    { label: 'Terminée', value: 'TERMINEE' },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map((l) => ({ label: l.nom, value: l.id })),
  ]);

  readonly filteredReservations = computed(() => this.filtrer(this.reservations()));
  readonly totalEnAttente = computed(
    () => this.reservations().filter((r) => r.statut === 'EN_ATTENTE').length,
  );

  detailModalVisible = signal(false);
  reservationSelectionnee = signal<Reservation | null>(null);

  ngOnInit(): void {
    // ?all=true : on veut voir les demandes de TOUT LE MONDE, pas les siennes.
    this.reservationService.charger({ all: true });
    this.laboratoireService.charger();
  }

  setFilter<K extends keyof FilterValues>(key: K, value: FilterValues[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  private filtrer(reservations: Reservation[]): Reservation[] {
    const { search, status, laboratoire } = this.filters();
    const searchLower = search.toLowerCase().trim();

    return reservations.filter(
      (r) =>
        (!searchLower ||
          r.demandeur_nom.toLowerCase().includes(searchLower) ||
          r.laboratoire_nom.toLowerCase().includes(searchLower) ||
          r.motif.toLowerCase().includes(searchLower)) &&
        (!status || r.statut === status) &&
        (!laboratoire || r.laboratoire === laboratoire),
    );
  }

  voir(reservation: Reservation): void {
    this.reservationSelectionnee.set(reservation);
    this.detailModalVisible.set(true);
  }

  valider(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Valider la demande de ${reservation.demandeur_nom} ?`,
      header: 'Confirmer la validation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, Valider',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.reservationService.valider(reservation.id).subscribe()
    });

  }

  refuser(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Refuser la demande de ${reservation.demandeur_nom} ?`,
      header: 'Confirmer le refus',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, refuser',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.reservationService.refuser(reservation.id).subscribe(),
    });
  }

  archiver(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Archiver la demande de ${reservation.demandeur_nom} ?`,
      header: 'Confirmer Archivage',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, Valider',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.reservationService.archiver(reservation.id).subscribe()
    });

  }
}
