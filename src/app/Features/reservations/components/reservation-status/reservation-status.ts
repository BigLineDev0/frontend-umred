import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

import { StatutReservation } from '../../models/reservation.model';

const STATUS_LABELS: Record<StatutReservation, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
  TERMINEE: 'Terminée',
};

const STATUS_SEVERITIES = {
  EN_ATTENTE: 'warn',
  VALIDEE: 'success',
  REFUSEE: 'danger',
  ANNULEE: 'secondary',
  TERMINEE: 'info',
} as const;

@Component({
  selector: 'app-reservation-status',
  imports: [TagModule],
  template: `
    <p-tag
      [value]="label()"
      [severity]="severity()"
      styleClass="!text-xs !font-medium"
    />
  `,
})
export class ReservationStatus {
  readonly status = input.required<StatutReservation>();

  readonly label = computed(() => STATUS_LABELS[this.status()]);

  readonly severity = computed(() => STATUS_SEVERITIES[this.status()]);
}
