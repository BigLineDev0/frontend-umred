import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Reservation } from '../../models/reservation.model';
import { ReservationFilter, ReservationFilters } from '../../components/reservation-filters/reservation-filters';
import { ReservationStats, ReservationStatsLabels } from '../../components/reservation-stats/reservation-stats';
import { ReservationTable } from '../../components/reservation-table/reservation-table';
import { ReservationCard } from '../../components/reservation-card/reservation-card';
import { ReservationService } from '../../services/reservation.service';

@Component({ selector: 'app-mes-demandes', templateUrl: './mes-demandes.html', styleUrl: './mes-demandes.css', imports: [RouterLink, ButtonModule, ReservationFilters, ReservationStats, ReservationTable, ReservationCard] })
export class MesDemandes {
  readonly reservationService = inject(ReservationService);
  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;
  readonly currentUserId = 4;
  readonly filters = signal<ReservationFilter>({ search: '', status: null, laboratoire: null, period: null });
  readonly labels: ReservationStatsLabels = { total: 'Total des demandes', enAttente: 'En attente', validees: 'Validées', dernier: 'Refusées' };
  readonly mesDemandes = computed(() => this.reservations().filter((reservation) => reservation.utilisateur.id === this.currentUserId));
  readonly filteredDemandes = computed(() => this.filterReservations(this.mesDemandes()));
  readonly totalDemandes = computed(() => this.mesDemandes().length);
  readonly demandesEnAttente = computed(() => this.count('EN_ATTENTE'));
  readonly demandesValidees = computed(() => this.count('VALIDEE'));
  readonly demandesRefusees = computed(() => this.count('REFUSEE'));

  private count(status: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE'): number { return this.mesDemandes().filter((reservation) => reservation.statut === status).length; }
  private filterReservations(reservations: Reservation[]): Reservation[] {
    const filters = this.filters(); const search = filters.search.toLowerCase().trim();
    return reservations.filter((reservation) => (!search || reservation.laboratoire.nom.toLowerCase().includes(search) || reservation.equipements.some((equipement) => equipement.nom.toLowerCase().includes(search)) || reservation.motif.toLowerCase().includes(search)) && (!filters.status || reservation.statut === filters.status) && (!filters.laboratoire || reservation.laboratoire.nom === filters.laboratoire) && (!filters.period || new Date(reservation.dateDebut).toDateString() === filters.period.toDateString()));
  }
  ngOnInit(): void { this.reservationService.loadReservations(); }
  voirDemande(reservation: Reservation): void { console.log('Voir ma demande :', reservation); }
  modifierDemande(reservation: Reservation): void { console.log('Modifier ma demande :', reservation); }
  annulerDemande(reservation: Reservation): void { console.log('Annuler ma demande :', reservation); }
}
