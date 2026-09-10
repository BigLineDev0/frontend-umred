import { Component, input } from '@angular/core';

export interface ReservationStatsLabels {
  total: string;
  enAttente: string;
  validees: string;
  dernier: string;
}

const DEFAULT_LABELS: ReservationStatsLabels = {
  total: 'Réservations totales',
  enAttente: 'En attente',
  validees: 'Validées',
  dernier: 'Terminées',
};

@Component({
  selector: 'app-reservation-stats',
  templateUrl: './reservation-stats.html',
})
export class ReservationStats {
  readonly total = input.required<number>();
  readonly enAttente = input.required<number>();
  readonly validees = input.required<number>();
  readonly dernier = input.required<number>();
  readonly labels = input<ReservationStatsLabels>(DEFAULT_LABELS);
}
