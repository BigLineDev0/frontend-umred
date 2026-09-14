import { Component, input, computed } from '@angular/core';
import { TagModule } from 'primeng/tag';

type Statut = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'EN_ATTENTE' | 'VALIDEE' | 'CONFIRMEE' | 'REFUSEE' | 'DISPONIBLE' | 'RESERVE' | 'EN_MAINTENANCE' | 'EN_PANNE' | 'HORS_SERVICE';

const STATUT_CONFIG: Record<Statut, { label: string; severity: 'success' | 'danger' | 'warn' | 'info' | 'secondary' }> = {
  PLANIFIEE:  { label: 'Planifiée', severity: 'info' },
  EN_COURS:   { label: 'En cours',  severity: 'warn' },
  TERMINEE:   { label: 'Terminée',  severity: 'success' },
  ANNULEE:    { label: 'Annulée',   severity: 'secondary' },
  EN_ATTENTE: { label: 'En attente', severity: 'warn' },
  VALIDEE:    { label: 'Validée', severity: 'success' },
  CONFIRMEE:  { label: 'Validée',   severity: 'success' },
  REFUSEE:    { label: 'Refusée',   severity: 'danger' },
  DISPONIBLE: { label: 'Disponible', severity: 'success' },
  RESERVE:    { label: 'Réservé',   severity: 'info' },
  EN_MAINTENANCE: { label: 'En maintenance', severity: 'warn' },
  EN_PANNE:   { label: 'En panne',   severity: 'danger' },
  HORS_SERVICE: { label: 'Hors service', severity: 'secondary' }
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TagModule],
  template: `<p-tag [value]="config().label" [severity]="config().severity" styleClass="!text-xs" />`
})
export class StatusBadge {
  statut = input.required<Statut>();
  config = computed(() => STATUT_CONFIG[this.statut()]);
}
