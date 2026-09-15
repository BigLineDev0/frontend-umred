import { Component, computed, effect, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { EquipementService } from '../../../../Core/services/equipement.service';

@Component({
  selector: 'app-signaler-panne-modal',
  standalone: true,
  imports: [DialogModule, SelectModule, TextareaModule, ButtonModule, FormsModule],
  templateUrl: './signaler-panne-modal.html'
})
export class SignalerPanneModal {
  visible = model(false);

  private maintenanceService = inject(MaintenanceService);
  private equipementService = inject(EquipementService);
  private messageService = inject(MessageService);

  submitting = signal(false);
  equipementId = signal<number | null>(null);
  description = signal('');

  // On exclut ce qui est déjà en panne ou hors service — signaler une
  // panne déjà signalée n'a pas de sens et créerait un doublon.
  readonly equipementOptions = computed(() =>
    this.equipementService.equipements()
      .filter(e => e.statut !== 'EN_PANNE' && e.statut !== 'HORS_SERVICE')
      .map(e => ({ label: `${e.nom} — ${e.laboratoire_nom}`, value: e.id }))
  );

  constructor() {
    effect(() => {
      if (this.visible()) this.equipementService.charger();
    });
  }

  onAnnuler(): void {
    this.visible.set(false);
    this.reset();
  }

  onSignaler(): void {
    if (!this.equipementId() || !this.description().trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Formulaire incomplet', detail: "Sélectionnez un équipement et décrivez la panne." });
      return;
    }

    this.submitting.set(true);
    this.maintenanceService.signalerPanne(this.equipementId()!, this.description().trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Panne signalée', detail: "L'équipement a été marqué en panne et l'intervention créée." });
        this.visible.set(false);
        this.reset();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.detail ?? 'Une erreur est survenue.' });
      },
    });
  }

  private reset(): void {
    this.equipementId.set(null);
    this.description.set('');
  }
}
