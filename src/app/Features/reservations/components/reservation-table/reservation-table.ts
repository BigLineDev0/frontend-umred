import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { Reservation, StatutReservation } from '../../models/reservation.model';
import { getDate, getEquipements, getHoraire } from '../reservation.utils';
import { ReservationStatus } from '../reservation-status/reservation-status';

@Component({
  selector: 'app-reservation-table',
  templateUrl: './reservation-table.html',
  styleUrl: './reservation-table.css',
  imports: [ButtonModule, TableModule, ReservationStatus],
})
export class ReservationTable {
  readonly reservations = input.required<Reservation[]>();
  readonly showUtilisateur = input(false);
  readonly editStatuses = input<StatutReservation[] | null>(null);
  readonly cancelStatuses = input<StatutReservation[] | null>(null);

  readonly view = output<Reservation>();
  readonly edit = output<Reservation>();
  readonly cancel = output<Reservation>();

  readonly getDate = getDate;
  readonly getEquipements = getEquipements;
  readonly getHoraire = getHoraire;

  canEdit(reservation: Reservation): boolean {
    return this.editStatuses() === null || this.editStatuses()?.includes(reservation.statut) === true;
  }

  canCancel(reservation: Reservation): boolean {
    return this.cancelStatuses() === null || this.cancelStatuses()?.includes(reservation.statut) === true;
  }
}
