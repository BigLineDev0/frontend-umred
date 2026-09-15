import { Component, computed, input, model, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Utilisateur } from '../../../Core/models/utilisateur.model';

@Component({
  selector: 'app-user-status-modal',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './user-status-modal.html'
})
export class UserStatusModal {
  visible = model(false);
  utilisateur = input<Utilisateur | null>(null);
  action = input<'activer' | 'desactiver'>('desactiver');
  loading = input(false);

  confirmed = output<void>();

  initiales = computed(() => {
    const u = this.utilisateur();
    return u ? `${u.prenom[0]}${u.nom[0]}`.toUpperCase() : '';
  });

  roleLabel = computed(() => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur', TECHNICIEN: 'Technicien',
      CHERCHEUR: 'Enseignant-chercheur', ETUDIANT: 'Étudiant',
    };
    return labels[this.utilisateur()?.role ?? ''] ?? '';
  });

  onAnnuler(): void { this.visible.set(false); }
  onConfirmer(): void { this.confirmed.emit(); }
}
