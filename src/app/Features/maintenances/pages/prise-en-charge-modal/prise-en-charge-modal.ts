import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';


@Component({
  selector: 'app-prise-en-charge-modal',
  standalone: true,
  imports: [DialogModule, DatePickerModule, ButtonModule, FormsModule],
  templateUrl: './prise-en-charge-modal.html'
})
export class PriseEnChargeModal {
  visible = model(false);
  maintenance = input<Maintenance | null>(null);
  priseEnChargeReussie = output<void>();

  private maintenanceService = inject(MaintenanceService);
  private messageService = inject(MessageService);

  datePlanifiee = signal<Date | null>(null);
  submitting = signal(false);
  today = new Date();

  onAnnuler(): void {
    this.visible.set(false);
    this.datePlanifiee.set(null);
  }

  onConfirmer(): void {
    const m = this.maintenance();
    const date = this.datePlanifiee();
    if (!m || !date) {
      this.messageService.add({ severity: 'warn', summary: 'Date requise', detail: "Merci de choisir une date d'intervention." });
      return;
    }

    this.submitting.set(true);
    this.maintenanceService.prendreEnCharge(m.id, date.toISOString()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Intervention prise en charge', detail: `Vous êtes désormais assigné à cette maintenance.` });
        this.visible.set(false);
        this.datePlanifiee.set(null);
        this.priseEnChargeReussie.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.detail ?? 'Une erreur est survenue.' });
      },
    });
  }
}
