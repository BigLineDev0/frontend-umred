import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Reservation } from '../../models/reservation.model';
import { ReservationFilter, ReservationFilters } from '../../components/reservation-filters/reservation-filters';
import { ReservationStats } from '../../components/reservation-stats/reservation-stats';
import { ReservationTable } from '../../components/reservation-table/reservation-table';
import { ReservationCard } from '../../components/reservation-card/reservation-card';
import { ReservationService } from '../../services/reservation.service';

@Component({ selector: 'app-mes-reservations', templateUrl: './mes-reservations.html', styleUrl: './mes-reservations.css', imports: [RouterLink, ButtonModule, ReservationFilters, ReservationStats, ReservationTable, ReservationCard] })
export class MesReservations {
  readonly reservationService = inject(ReservationService);
  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;
  readonly currentUserId = 2;
  readonly filters = signal<ReservationFilter>({ search: '', status: null, laboratoire: null, period: null });
  readonly mesReservations = computed(() => this.reservations().filter((reservation) => reservation.utilisateur.id === this.currentUserId));
  readonly filteredReservations = computed(() => this.filterReservations(this.mesReservations()));
  readonly totalReservations = computed(() => this.mesReservations().length);
  readonly reservationsEnAttente = computed(() => this.count('EN_ATTENTE'));
  readonly reservationsValidees = computed(() => this.count('VALIDEE'));
  readonly reservationsTerminees = computed(() => this.count('TERMINEE'));

  private count(status: 'EN_ATTENTE' | 'VALIDEE' | 'TERMINEE'): number { return this.mesReservations().filter((reservation) => reservation.statut === status).length; }
  private filterReservations(reservations: Reservation[]): Reservation[] {
    const filters = this.filters(); const search = filters.search.toLowerCase().trim();
    return reservations.filter((reservation) => (!search || reservation.laboratoire.nom.toLowerCase().includes(search) || reservation.equipements.some((equipement) => equipement.nom.toLowerCase().includes(search)) || reservation.motif.toLowerCase().includes(search)) && (!filters.status || reservation.statut === filters.status) && (!filters.laboratoire || reservation.laboratoire.nom === filters.laboratoire) && (!filters.period || new Date(reservation.dateDebut).toDateString() === filters.period.toDateString()));
  }
  ngOnInit(): void { this.reservationService.loadReservations(); }
  voirReservation(reservation: Reservation): void { console.log('Voir ma réservation :', reservation); }
  modifierReservation(reservation: Reservation): void { console.log('Modifier ma réservation :', reservation); }
  annulerReservation(reservation: Reservation): void { console.log('Annuler ma réservation :', reservation); }
}
