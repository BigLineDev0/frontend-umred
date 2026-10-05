import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { messageErreur } from '../../../../Shared/utils/message-erreur';


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
  // Minimum = maintenant (et non aujourd'hui à minuit) : une heure déjà
  // passée serait refusée par le serveur.
  get maintenant(): Date { return new Date(); }

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
    if (date.getTime() < Date.now() - 5 * 60 * 1000) {
      this.messageService.add({ severity: 'warn', summary: 'Date passée', detail: "Choisissez une date et une heure à venir." });
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
        this.messageService.add({ severity: 'error', summary: 'Prise en charge impossible', detail: messageErreur(err) });
      },
    });
  }
}
