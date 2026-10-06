import { Component, effect, inject, input, model, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DatePipe } from '@angular/common';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { EvenementReservation, Reservation } from '../../../../Core/models/reservation.model';
import { ReservationService } from '../../../../Core/services/reservation.service';

@Component({
  selector: 'app-reservation-detail-modal',
  standalone: true,
  imports: [DialogModule, DatePipe, StatusBadge],
  templateUrl: './reservation-detail-modal.html'
})
export class ReservationDetailModal {
  private readonly reservationService = inject(ReservationService);

  visible = model(false);
  reservation = input<Reservation | null>(null);

  // Chronologie issue du journal d'audit, chargée à chaque ouverture : elle
  // reflète l'état réel côté serveur, pas une reconstitution du navigateur.
  readonly historique = signal<EvenementReservation[]>([]);
  readonly historiqueChargement = signal(false);

  constructor() {
    effect(() => {
      const r = this.reservation();
      if (!this.visible() || !r) return;
      this.historique.set([]);
      this.historiqueChargement.set(true);
      this.reservationService.historique(r.id).subscribe({
        next: (evenements) => { this.historique.set(evenements); this.historiqueChargement.set(false); },
        error: () => this.historiqueChargement.set(false),
      });
    });
  }

  icone(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('refus')) return 'pi pi-times-circle text-red-600';
    if (a.includes('validation')) return 'pi pi-check-circle text-green-600';
    if (a.includes('annulation')) return 'pi pi-ban text-amber-600';
    if (a.includes('archivage')) return 'pi pi-box text-text-secondary';
    if (a.includes('création')) return 'pi pi-plus-circle text-primary';
    return 'pi pi-circle text-text-secondary';
  }
}
