import { Injectable, signal } from '@angular/core';

import { Reservation } from '../models/reservation.model';
import { RESERVATIONS_MOCK } from '../data/reservations.mock';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {

  /**
   * État central des réservations.
   * Il est privé afin que les composants ne puissent pas
   * modifier directement les données.
   */
  private reservationsState = signal<Reservation[]>(
    RESERVATIONS_MOCK
  );

  /**
   * Lecture seule de l'état.
   */
  readonly reservations = this.reservationsState.asReadonly();

  /**
   * États liés à l'interface.
   */
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);


  /**
   * Charge les réservations.
   *
   * Pour le moment, les données viennent du fichier mock.
   * Plus tard, cette méthode appellera l'API Django.
   */
  loadReservations(): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      this.reservationsState.set(RESERVATIONS_MOCK);
      this.loading.set(false);
    }, 500);
  }


  /**
   * Retourne une réservation à partir de son identifiant.
   */
  getReservationById(id: number): Reservation | undefined {
    return this.reservationsState().find(
      reservation => reservation.id === id
    );
  }


  /**
   * Ajoute une réservation dans l'état.
   *
   * Cette méthode servira plus tard après la création
   * réussie d'une réservation via l'API.
   */
  addReservation(reservation: Reservation): void {
    this.reservationsState.update(reservations => [
      ...reservations,
      reservation,
    ]);
  }


  /**
   * Met à jour une réservation.
   */
  updateReservation(updatedReservation: Reservation): void {
    this.reservationsState.update(reservations =>
      reservations.map(reservation =>
        reservation.id === updatedReservation.id
          ? updatedReservation
          : reservation
      )
    );
  }


  /**
   * Supprime une réservation.
   *
   * Pour notre projet, on pourra ensuite remplacer cette logique
   * par une annulation plutôt qu'une suppression physique.
   */
  removeReservation(id: number): void {
    this.reservationsState.update(reservations =>
      reservations.filter(reservation => reservation.id !== id)
    );
  }
}
