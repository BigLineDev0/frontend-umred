import { Component, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';

@Component({
  selector: 'app-maintenance-cloture-modal',
  standalone: true,
  imports: [DialogModule, TextareaModule, ButtonModule, FormsModule, DatePipe],
  templateUrl: './maintenance-cloture-modal.html'
})
export class MaintenanceClotureModal {
  visible = model(false);
  maintenance = input<Maintenance | null>(null);

  private maintenanceService = inject(MaintenanceService);
  private messageService = inject(MessageService);

  rapport = signal('');
  submitting = signal(false);

  onAnnuler(): void {
    this.visible.set(false);
    this.rapport.set('');
  }

  onCloturer(): void {
    const m = this.maintenance();
    if (!m || !this.rapport().trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Compte-rendu requis', detail: "Merci de décrire l'intervention réalisée." });
      return;
    }

    this.submitting.set(true);
    this.maintenanceService.cloturer(m.id, this.rapport().trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Maintenance clôturée', detail: "L'équipement redevient disponible." });
        this.visible.set(false);
        this.rapport.set('');
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue.' });
      },
    });
  }
}
