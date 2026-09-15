import { Component, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Role, Utilisateur, UtilisateurPayload } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';


@Component({
  selector: 'app-utilisateur-form-modal',
  standalone: true,
  imports: [DialogModule, InputTextModule, SelectModule, ButtonModule, FormsModule],
  templateUrl: './utilisateur-form-modal.html'
})
export class UtilisateurFormModal {
  visible = model(false);
  utilisateurAModifier = input<Utilisateur | null>(null);

  private utilisateurService = inject(UtilisateurService);
  private messageService = inject(MessageService);

  submitting = signal(false);
  form = { nom: '', prenom: '', email: '', telephone: '', role: 'ETUDIANT' as Role };

  roleOptions = [
    { label: 'Administrateur', value: 'ADMIN' },
    { label: 'Technicien', value: 'TECHNICIEN' },
    { label: 'Enseignant-chercheur', value: 'CHERCHEUR' },
    { label: 'Étudiant', value: 'ETUDIANT' },
  ];

  get isEditMode(): boolean {
    return this.utilisateurAModifier() !== null;
  }

  constructor() {
    effect(() => {
      const u = this.utilisateurAModifier();
      if (this.visible()) {
        this.form = u
          ? { nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone, role: u.role }
          : { nom: '', prenom: '', email: '', telephone: '', role: 'ETUDIANT' };
      }
    });
  }

  onAnnuler(): void { this.visible.set(false); }

  onValider(): void {
    if (!this.form.nom.trim() || !this.form.prenom.trim() || !this.form.email.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Formulaire incomplet', detail: 'Merci de remplir les champs obligatoires.' });
      return;
    }

    const payload: UtilisateurPayload = {
      nom: this.form.nom.trim(), prenom: this.form.prenom.trim(),
      email: this.form.email.trim(), telephone: this.form.telephone.trim(), role: this.form.role,
    };

    this.submitting.set(true);
    const modifier = this.utilisateurAModifier();
    const requete = modifier
      ? this.utilisateurService.modifier(modifier.id, payload)
      : this.utilisateurService.creer(payload);

    requete.subscribe({
      next: () => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: modifier ? 'Utilisateur modifié' : 'Utilisateur créé',
          detail: modifier
            ? `Les informations de ${payload.prenom} ont été mises à jour.`
            : `Un email contenant les identifiants a été envoyé à ${payload.email}.`,
        });
        this.visible.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.email?.[0] ?? 'Une erreur est survenue.' });
      },
    });
  }
}
