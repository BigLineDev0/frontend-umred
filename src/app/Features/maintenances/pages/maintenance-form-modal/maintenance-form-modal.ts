import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { messageErreur } from '../../../../Shared/utils/message-erreur';
import {
  appliquerErreursServeur, dateNonPassee, messageErreurChamp, texteLong,
} from '../../../../Shared/validators/validators';

import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { EquipementService } from '../../../../Core/services/equipement.service';

@Component({
  selector: 'app-maintenance-form-modal',
  standalone: true,
  imports: [DialogModule, SelectModule, DatePickerModule, TextareaModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './maintenance-form-modal.html'
})
export class MaintenanceFormModal {
  visible = model(false);
  // Permet d'ouvrir le modal directement pré-rempli depuis la page
  // "Équipements en panne" — évite un choix redondant à l'utilisateur.
  equipementPreselectionne = input<number | null>(null);

  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private equipementService = inject(EquipementService);
  private messageService = inject(MessageService);

  submitting = signal(false);
  readonly today = new Date();

  form = this.fb.nonNullable.group({
    type: ['CORRECTIVE' as 'PREVENTIVE' | 'CORRECTIVE', Validators.required],
    equipement: [null as number | null, Validators.required],
    datePlanifiee: [null as Date | null, [Validators.required, dateNonPassee()]],
    description: ['', [Validators.required, texteLong({ min: 5, max: 2000, obligatoire: true })]],
  });

  typeOptions = [
    { label: 'Corrective (panne)', value: 'CORRECTIVE' },
    { label: 'Préventive', value: 'PREVENTIVE' },
  ];

  // Signal miroir du type choisi : un getter recréait un nouveau tableau
  // d'options à chaque détection de changement, ce qui faisait re-rendre la
  // liste du p-select pendant le survol et rendait la sélection difficile.
  private typeCourant = signal<'PREVENTIVE' | 'CORRECTIVE'>('CORRECTIVE');

  equipementOptions = computed(() => {
    const source = this.typeCourant() === 'CORRECTIVE'
      ? this.equipementService.equipements().filter(e => e.statut === 'EN_PANNE')
      : this.equipementService.equipements().filter(e => e.statut !== 'HORS_SERVICE');
    return source.map(e => ({ label: `${e.nom} — ${e.laboratoire_nom}`, value: e.id }));
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.equipementService.charger();
        const preselection = this.equipementPreselectionne();
        if (preselection) {
          this.form.patchValue({ equipement: preselection, type: 'CORRECTIVE' });
          this.typeCourant.set('CORRECTIVE');
        }
      }
    });
  }

  getFieldError(nom: string): string {
    return messageErreurChamp(this.form.get(nom));
  }

  isFieldInvalid(nom: string): boolean {
    const c = this.form.get(nom);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  onTypeChange(): void {
    this.typeCourant.set(this.form.controls.type.value);
    const ids = this.equipementOptions().map(o => o.value);
    const equipement = this.form.controls.equipement.value;
    if (equipement && !ids.includes(equipement)) {
      this.form.controls.equipement.setValue(null);
    }
  }

  onAnnuler(): void {
    this.visible.set(false);
    this.resetForm();
  }

  onPlanifier(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.maintenanceService.creer({
      equipement: value.equipement!,
      type: value.type,
      description: value.description.trim(),
      date_planifiee: value.datePlanifiee!.toISOString(),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Maintenance planifiée', detail: "L'intervention a été planifiée avec succès." });
        this.visible.set(false);
        this.resetForm();
      },
      error: (err) => {
        this.submitting.set(false);
        const global = appliquerErreursServeur(this.form, err?.error, { date_planifiee: 'datePlanifiee' });
        this.messageService.add({ severity: 'error', summary: 'Planification impossible', detail: global ?? messageErreur(err) });
      },
    });
  }

  private resetForm(): void {
    this.form.reset({ type: 'CORRECTIVE', equipement: null, datePlanifiee: null, description: '' });
    this.typeCourant.set('CORRECTIVE');
  }
}
