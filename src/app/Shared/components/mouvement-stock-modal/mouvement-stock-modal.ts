import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { Consommable } from '../../../Core/models/consommable.model';
import { ConsommableService } from '../../../Core/services/consommable.service';

@Component({
  selector: 'app-mouvement-stock-modal',
  standalone: true,
  imports: [DialogModule, InputNumberModule, InputTextModule, ButtonModule, FormsModule],
  templateUrl: './mouvement-stock-modal.html'
})
export class MouvementStockModal {
  visible = model(false);
  consommable = input<Consommable | null>(null);
  mode = input<'retirer' | 'reapprovisionner'>('retirer');
  mouvementEffectue = output<void>();

  private consommableService = inject(ConsommableService);
  private messageService = inject(MessageService);

  quantite = signal<number | null>(null);
  motif = signal('');
  submitting = signal(false);

  get titre(): string {
    return this.mode() === 'retirer' ? 'Déclarer une utilisation' : 'Enregistrer un réapprovisionnement';
  }

  onAnnuler(): void {
    this.visible.set(false);
    this.reset();
  }

  onConfirmer(): void {
    const c = this.consommable();
    const q = this.quantite();
    if (!c || !q || q <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Quantité requise', detail: 'Merci de saisir une quantité valide.' });
      return;
    }

    this.submitting.set(true);
    const requete = this.mode() === 'retirer'
      ? this.consommableService.retirer(c.id, q, this.motif())
      : this.consommableService.reapprovisionner(c.id, q, this.motif());

    requete.subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.mode() === 'retirer' ? 'Utilisation enregistrée' : 'Stock mis à jour',
          detail: `${c.nom} — nouvelle quantité mise à jour.`,
        });
        this.visible.set(false);
        this.reset();
        this.mouvementEffectue.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.[0] ?? 'Une erreur est survenue.' });
      },
    });
  }

  private reset(): void {
    this.quantite.set(null);
    this.motif.set('');
  }
}
