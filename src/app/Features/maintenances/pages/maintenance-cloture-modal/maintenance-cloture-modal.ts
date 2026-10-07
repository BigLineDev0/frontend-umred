import { Component, inject, input, model, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { appliquerErreursServeur, messageErreurChamp, texteLong } from '../../../../Shared/validators/validators';

@Component({
  selector: 'app-maintenance-cloture-modal',
  standalone: true,
  imports: [DialogModule, TextareaModule, ButtonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './maintenance-cloture-modal.html'
})
export class MaintenanceClotureModal {
  visible = model(false);
  maintenance = input<Maintenance | null>(null);

  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private messageService = inject(MessageService);

  submitting = signal(false);

  form = this.fb.nonNullable.group({
    rapport: ['', [Validators.required, texteLong({ min: 5, max: 2000, obligatoire: true })]],
  });

  getFieldError(nom: string): string {
    return messageErreurChamp(this.form.get(nom));
  }

  isFieldInvalid(nom: string): boolean {
    const c = this.form.get(nom);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  onAnnuler(): void {
    this.visible.set(false);
    this.form.reset({ rapport: '' });
  }

  onCloturer(): void {
    const m = this.maintenance();
    if (!m || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.maintenanceService.cloturer(m.id, this.form.controls.rapport.value.trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Maintenance clôturée', detail: "L'équipement redevient disponible." });
        this.visible.set(false);
        this.form.reset({ rapport: '' });
      },
      error: (err) => {
        this.submitting.set(false);
        const global = appliquerErreursServeur(this.form, err?.error);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: global ?? 'Une erreur est survenue.' });
      },
    });
  }
}
