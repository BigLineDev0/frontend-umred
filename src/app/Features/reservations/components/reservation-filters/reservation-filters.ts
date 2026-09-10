import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { StatutReservation } from '../../models/reservation.model';

export interface ReservationFilter {
  search: string;
  status: StatutReservation | null;
  laboratoire: string | null;
  period: Date | null;
}

export const STATUS_OPTIONS: { label: string; value: StatutReservation | null }[] = [
  { label: 'Tous', value: null },
  { label: 'Validée', value: 'VALIDEE' },
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Refusée', value: 'REFUSEE' },
  { label: 'Annulée', value: 'ANNULEE' },
  { label: 'Terminée', value: 'TERMINEE' },
];

export const LABORATORY_OPTIONS = [
  { label: 'Tous', value: null },
  { label: 'Laboratoire de Biochimie', value: 'Laboratoire de Biochimie' },
  { label: 'Laboratoire de Microbiologie', value: 'Laboratoire de Microbiologie' },
  { label: 'Laboratoire de Biologie Moléculaire', value: 'Laboratoire de Biologie Moléculaire' },
  { label: 'Laboratoire de Physique', value: 'Laboratoire de Physique' },
  { label: 'Laboratoire de Chimie Organique', value: 'Laboratoire de Chimie Organique' },
];

@Component({
  selector: 'app-reservation-filters',
  templateUrl: './reservation-filters.html',
  styleUrl: './reservation-filters.css',
  imports: [
    FormsModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
  ],
})
export class ReservationFilters {
  readonly filters = model<ReservationFilter>({
    search: '',
    status: null,
    laboratoire: null,
    period: null,
  });

  readonly statusOptions = STATUS_OPTIONS;
  readonly laboratoireOptions = LABORATORY_OPTIONS;

  updateFilter<Key extends keyof ReservationFilter>(key: Key, value: ReservationFilter[Key]): void {
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }
}
