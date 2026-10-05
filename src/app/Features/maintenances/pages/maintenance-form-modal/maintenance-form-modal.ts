import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { EquipementService } from '../../../../Core/services/equipement.service';

@Component({
  selector: 'app-maintenance-form-modal',
  standalone: true,
  imports: [DialogModule, SelectModule, DatePickerModule, TextareaModule, ButtonModule, FormsModule],
  templateUrl: './maintenance-form-modal.html'
})
export class MaintenanceFormModal {
  visible = model(false);
  // Permet d'ouvrir le modal directement pré-rempli depuis la page
  // "Équipements en panne" — évite un choix redondant à l'utilisateur.
  equipementPreselectionne = input<number | null>(null);

  private maintenanceService = inject(MaintenanceService);
  private equipementService = inject(EquipementService);
  private messageService = inject(MessageService);

  submitting = signal(false);

  form = {
    equipement: null as number | null,
    type: 'CORRECTIVE' as 'PREVENTIVE' | 'CORRECTIVE',
    datePlanifiee: null as Date | null,
    description: '',
  };

  typeOptions = [
    { label: 'Corrective (panne)', value: 'CORRECTIVE' },
    { label: 'Préventive', value: 'PREVENTIVE' },
  ];

  // Signal miroir de form.type : un getter recréait un nouveau tableau d'options
  // à chaque détection de changement, ce qui faisait re-rendre la liste du
  // p-select pendant le survol et rendait la sélection difficile.
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
          this.form.equipement = preselection;
          this.form.type = 'CORRECTIVE';
          this.typeCourant.set('CORRECTIVE');
        }
      }
    });
  }

  onTypeChange(): void {
    this.typeCourant.set(this.form.type);
    const ids = this.equipementOptions().map(o => o.value);
    if (this.form.equipement && !ids.includes(this.form.equipement)) {
      this.form.equipement = null;
    }
  }

  onAnnuler(): void {
    this.visible.set(false);
    this.resetForm();
  }

  onPlanifier(): void {
    if (!this.form.equipement || !this.form.datePlanifiee || !this.form.description.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Formulaire incomplet', detail: 'Merci de remplir tous les champs obligatoires.' });
      return;
    }

    this.submitting.set(true);
    this.maintenanceService.creer({
      equipement: this.form.equipement,
      type: this.form.type,
      description: this.form.description.trim(),
      date_planifiee: this.form.datePlanifiee.toISOString(),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Maintenance planifiée', detail: "L'intervention a été planifiée avec succès." });
        this.visible.set(false);
        this.resetForm();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Planification impossible', detail: messageErreur(err) });
      },
    });
  }

  private resetForm(): void {
    this.form = { equipement: null, type: 'CORRECTIVE', datePlanifiee: null, description: '' };
    this.typeCourant.set('CORRECTIVE');
  }
}
