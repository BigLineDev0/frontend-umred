import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { Reservation } from '../../models/reservation.model';
import { ReservationFilters, ReservationFilter } from '../../components/reservation-filters/reservation-filters';
import { ReservationStats } from '../../components/reservation-stats/reservation-stats';
import { ReservationTable } from '../../components/reservation-table/reservation-table';
import { ReservationCard } from '../../components/reservation-card/reservation-card';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-admin-reservation',
  templateUrl: './admin-reservation.html',
  styleUrl: './admin-reservation.css',
  imports: [RouterLink, ButtonModule, ReservationFilters, ReservationStats, ReservationTable, ReservationCard],
})
export class AdminReservation {
  readonly reservationService = inject(ReservationService);
  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;

  readonly filters = signal<ReservationFilter>({ search: '', status: null, laboratoire: null, period: null });

  readonly filteredReservations = computed(() => {
    const filters = this.filters();
    const search = filters.search.toLowerCase().trim();

    return this.reservations().filter((reservation) => {
      const utilisateur = `${reservation.utilisateur.prenom} ${reservation.utilisateur.nom}`.toLowerCase();
      const matchesSearch = !search || utilisateur.includes(search) || reservation.laboratoire.nom.toLowerCase().includes(search) || reservation.equipements.some((equipement) => equipement.nom.toLowerCase().includes(search));
      const matchesStatus = !filters.status || reservation.statut === filters.status;
      const matchesLaboratoire = !filters.laboratoire || reservation.laboratoire.nom === filters.laboratoire;
      const matchesPeriod = !filters.period || new Date(reservation.dateDebut).toDateString() === filters.period.toDateString();
      return matchesSearch && matchesStatus && matchesLaboratoire && matchesPeriod;
    });
  });

  readonly totalReservations = computed(() => this.reservations().length);
  readonly reservationsEnAttente = computed(() => this.reservations().filter((reservation) => reservation.statut === 'EN_ATTENTE').length);
  readonly reservationsValidees = computed(() => this.reservations().filter((reservation) => reservation.statut === 'VALIDEE').length);
  readonly reservationsTerminees = computed(() => this.reservations().filter((reservation) => reservation.statut === 'TERMINEE').length);

  ngOnInit(): void {
    this.reservationService.loadReservations();
  }

  voirReservation(reservation: Reservation): void { console.log('Voir réservation :', reservation); }
  modifierReservation(reservation: Reservation): void { console.log('Modifier réservation :', reservation); }
  annulerReservation(reservation: Reservation): void { console.log('Annuler réservation :', reservation); }
}
