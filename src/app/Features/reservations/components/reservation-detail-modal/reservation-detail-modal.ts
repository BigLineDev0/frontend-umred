import { Component, input, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DatePipe } from '@angular/common';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { Reservation } from '../../../../Core/models/reservation.model';

@Component({
  selector: 'app-reservation-detail-modal',
  standalone: true,
  imports: [DialogModule, DatePipe, StatusBadge],
  templateUrl: './reservation-detail-modal.html'
})
export class ReservationDetailModal {
  visible = model(false);
  reservation = input<Reservation | null>(null);
}
