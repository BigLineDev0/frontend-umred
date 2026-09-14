import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { RowActions } from '../../../../Shared/components/row-actions';
import { Reservation } from '../../../../Core/models/reservation.model';
import { ReservationService } from '../../../../Core/services/reservatiom.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { ReservationDetailModal } from '../../components/reservation-detail-modal/reservation-detail-modal';

interface ReservationFilterValues {
  search: string;
  status: Reservation['statut'] | null;
  laboratoire: number | null;
  period: Date | null;
}

@Component({
  selector: 'app-mes-reservations',
  templateUrl: './mes-reservations.html',
  styleUrl: './mes-reservations.css',
  providers: [ConfirmationService],
  imports: [
    DatePipe,
    RouterLink,
    ButtonModule,
    FormsModule,
    SelectModule,
    ConfirmDialogModule,
    PageHeader,
    FilterBar,
    MiniStatCard,
    DataTable,
    ColumnTemplateDirective,
    StatusBadge,
    RowActions,
    ReservationDetailModal
  ],
})
export class MesReservations implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  private confirmationService = inject(ConfirmationService);

  detailModalVisible = signal(false);
  reservationSelectionnee = signal<Reservation | null>(null);

  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;

  readonly filters = signal<ReservationFilterValues>({
    search: '',
    status: null,
    laboratoire: null,
    period: null,
  });

  readonly columns: TableColumn<Reservation>[] = [
    { field: 'laboratoire_nom', header: 'Laboratoire' },
    { field: 'equipements_noms', header: 'Équipement' },
    { field: 'date', header: 'Date' },
    { field: 'creneau', header: 'Horaire' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '120px' },
  ];

  readonly statusOptions = [
    { label: 'Tous', value: null },
    { label: 'Validée', value: 'VALIDEE' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Refusée', value: 'REFUSEE' },
    { label: 'Annulée', value: 'ANNULEE' },
    { label: 'Terminée', value: 'TERMINEE' },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map((l) => ({ label: l.nom, value: l.id })),
  ]);

  readonly filteredReservations = computed(() => this.filterReservations(this.reservations()));
  readonly totalReservations = computed(() => this.reservations().length);
  readonly reservationsEnAttente = computed(() => this.count('EN_ATTENTE'));
  readonly reservationsValidees = computed(() => this.count('VALIDEE'));
  readonly reservationsTerminees = computed(() => this.count('ANNULEE'));

  ngOnInit(): void {
    this.reservationService.charger();
    this.laboratoireService.charger();
  }

  setFilter<K extends keyof ReservationFilterValues>(
    key: K,
    value: ReservationFilterValues[K],
  ): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  private count(status: Reservation['statut']): number {
    return this.reservations().filter((r) => r.statut === status).length;
  }

  private filterReservations(reservations: Reservation[]): Reservation[] {
    const { search, status, laboratoire, period } = this.filters();
    const searchLower = search.toLowerCase().trim();

    return reservations.filter(
      (r) =>
        (!searchLower ||
          r.laboratoire_nom.toLowerCase().includes(searchLower) ||
          r.equipements_noms.some((nom) => nom.toLowerCase().includes(searchLower)) ||
          r.motif.toLowerCase().includes(searchLower)) &&
        (!status || r.statut === status) &&
        (!laboratoire || r.laboratoire === laboratoire) &&
        (!period || r.date === period.toISOString().split('T')[0]),
    );
  }

  voirReservation(reservation: Reservation): void {
    this.reservationSelectionnee.set(reservation);
    this.detailModalVisible.set(true);
  }

  annulerReservation(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Annuler la réservation du ${reservation.date} ?`,
      header: "Confirmer l'annulation",
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, annuler',
      rejectLabel: 'Retour',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.reservationService.annuler(reservation.id).subscribe();
      },
    });
  }
}
