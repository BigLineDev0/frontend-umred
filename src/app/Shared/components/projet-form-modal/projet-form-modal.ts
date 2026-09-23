import { Component, inject, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { ProjetService } from '../../../Core/services/projet.service';

@Component({
  selector: 'app-projet-form-modal',
  standalone: true,
  imports: [DialogModule, InputTextModule, TextareaModule, ButtonModule, FormsModule],
  templateUrl: './projet-form-modal.html'
})
export class ProjetFormModal {
  visible = model(false);
  projetCree = output<number>(); // renvoie l'id du projet créé, pour pré-sélection immédiate

  private projetService = inject(ProjetService);
  private messageService = inject(MessageService);

  nom = signal('');
  description = signal('');
  submitting = signal(false);

  onAnnuler(): void {
    this.visible.set(false);
    this.reset();
  }

  onCreer(): void {
    if (!this.nom().trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nom requis', detail: 'Merci de donner un nom à votre projet.' });
      return;
    }

    this.submitting.set(true);
    this.projetService.creer({ nom: this.nom().trim(), description: this.description().trim() }).subscribe({
      next: (projet) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Projet créé', detail: `« ${projet.nom} » a été créé.` });
        this.visible.set(false);
        this.projetCree.emit(projet.id);
        this.reset();
      },
      error: () => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer le projet.' });
      },
    });
  }

  private reset(): void {
    this.nom.set('');
    this.description.set('');
  }
}
