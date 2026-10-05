import { Component, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Encadrant, Role, StatutAcademique, Utilisateur, UtilisateurPayload } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

@Component({
  selector: 'app-utilisateur-form-modal',
  standalone: true,
  imports: [DialogModule, InputTextModule, SelectModule, ButtonModule, FormsModule],
  templateUrl: './utilisateur-form-modal.html',
})
export class UtilisateurFormModal {
  visible = model(false);
  utilisateurAModifier = input<Utilisateur | null>(null);

  private utilisateurService = inject(UtilisateurService);
  private messageService = inject(MessageService);

  submitting = signal(false);
  encadrants = signal<Encadrant[]>([]);
  form = this.formulaireVide();

  // Le statut académique départage les demandes concurrentes (priorité) :
  // il doit donc pouvoir être saisi pour un enseignant-chercheur.
  statutAcademiqueOptions = [
    { label: 'Doctorant', value: 'DOCTORANT' },
    { label: 'Maître de conférences', value: 'MAITRE_DE_CONFERENCES' },
    { label: 'Professeur des universités', value: 'PROFESSEUR' },
  ];

  private formulaireVide() {
    return {
      nom: '', prenom: '', email: '', telephone: '', role: 'ETUDIANT' as Role,
      statut_academique: null as StatutAcademique | null, encadrant: null as number | null,
    };
  }

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
          ? { nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone, role: u.role,
              statut_academique: u.statut_academique, encadrant: u.encadrant }
          : this.formulaireVide();
        this.utilisateurService.encadrants().subscribe({ next: (liste) => this.encadrants.set(liste) });
      }
    });
  }

  onAnnuler(): void {
    this.visible.set(false);
  }

  onValider(): void {
    if (!this.form.nom.trim() || !this.form.prenom.trim() || !this.form.email.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire incomplet',
        detail: 'Merci de remplir les champs obligatoires.',
      });
      return;
    }

    const payload: UtilisateurPayload = {
      nom: this.form.nom.trim(),
      prenom: this.form.prenom.trim(),
      email: this.form.email.trim(),
      telephone: this.form.telephone.trim(),
      role: this.form.role,
      // Chaque champ n'a de sens que pour un rôle : on vide l'autre pour ne
      // pas garder un encadrant à un chercheur (refusé par le serveur).
      statut_academique: this.form.role === 'CHERCHEUR' ? this.form.statut_academique : null,
      encadrant: this.form.role === 'ETUDIANT' ? this.form.encadrant : null,
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
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: messageErreur(err),
        });
      },
    });
  }
}
