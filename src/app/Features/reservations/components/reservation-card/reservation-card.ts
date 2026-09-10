import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { Reservation, StatutReservation } from '../../models/reservation.model';
import { getDate, getEquipementsMobile, getHoraire } from '../reservation.utils';
import { ReservationStatus } from '../reservation-status/reservation-status';

@Component({
  selector: 'app-reservation-card',
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.css',
  imports: [ButtonModule, TagModule, ReservationStatus],
})
export class ReservationCard {
  readonly reservations = input.required<Reservation[]>();
  readonly showUtilisateur = input(false);
  readonly showMotif = input(false);
  readonly editStatuses = input<StatutReservation[] | null>(null);
  readonly cancelStatuses = input<StatutReservation[] | null>(null);

  readonly view = output<Reservation>();
  readonly edit = output<Reservation>();
  readonly cancel = output<Reservation>();

  readonly getDate = getDate;
  readonly getEquipementsMobile = getEquipementsMobile;
  readonly getHoraire = getHoraire;

  canEdit(reservation: Reservation): boolean {
    return this.editStatuses() === null || this.editStatuses()?.includes(reservation.statut) === true;
  }

  canCancel(reservation: Reservation): boolean {
    return this.cancelStatuses() === null || this.cancelStatuses()?.includes(reservation.statut) === true;
  }
}
