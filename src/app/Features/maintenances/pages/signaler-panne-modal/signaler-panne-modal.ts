import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { messageErreur } from '../../../../Shared/utils/message-erreur';
import { appliquerErreursServeur, messageErreurChamp, texteLong } from '../../../../Shared/validators/validators';

@Component({
  selector: 'app-signaler-panne-modal',
  standalone: true,
  imports: [DialogModule, SelectModule, TextareaModule, ButtonModule, ReactiveFormsModule],
  templateUrl: './signaler-panne-modal.html'
})
export class SignalerPanneModal {
  visible = model(false);
  // Ouvert depuis la fiche d'un équipement : il est déjà choisi, la liste
  // déroulante est masquée.
  equipementPreselectionne = input<{ id: number; nom: string } | null>(null);
  panneSignalee = output<void>();

  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private equipementService = inject(EquipementService);
  private messageService = inject(MessageService);

  submitting = signal(false);

  form = this.fb.nonNullable.group({
    equipement: [null as number | null, Validators.required],
    description: ['', [Validators.required, texteLong({ min: 5, max: 2000, obligatoire: true })]],
  });

  // On exclut ce qui est déjà en panne ou hors service — signaler une
  // panne déjà signalée n'a pas de sens et créerait un doublon.
  readonly equipementOptions = computed(() =>
    this.equipementService.equipements()
      .filter(e => e.statut !== 'EN_PANNE' && e.statut !== 'HORS_SERVICE')
      .map(e => ({ label: `${e.nom} — ${e.laboratoire_nom}`, value: e.id }))
  );

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const preselection = this.equipementPreselectionne();
      if (preselection) {
        this.form.controls.equipement.setValue(preselection.id);
      } else {
        this.equipementService.charger();
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

  onAnnuler(): void {
    this.visible.set(false);
    this.reset();
  }

  onSignaler(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.maintenanceService.signalerPanne(value.equipement!, value.description.trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Panne signalée', detail: "Les techniciens sont prévenus, ainsi que les personnes ayant réservé cet équipement." });
        this.visible.set(false);
        this.reset();
        this.panneSignalee.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        const global = appliquerErreursServeur(this.form, err?.error);
        this.messageService.add({ severity: 'error', summary: 'Signalement impossible', detail: global ?? messageErreur(err) });
      },
    });
  }

  private reset(): void {
    this.form.reset({ equipement: null, description: '' });
  }
}
