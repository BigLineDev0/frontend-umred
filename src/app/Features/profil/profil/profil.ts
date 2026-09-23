import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../Core/services/auth.service';
import { UtilisateurService } from '../../../Core/services/utilisateur.service';
import { JournalService } from '../../../Core/services/journal.service';
import { Utilisateur } from '../../../Core/models/utilisateur.model';
import { badgeAction } from '../../../Shared/utils/journal-badge';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { StatusBadge } from '../../../Shared/components/status-badge';


@Component({
  standalone: true,
  selector: 'app-profil',
  templateUrl: './profil.html',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, InputTextModule, PasswordModule, TagModule, PageHeader, StatusBadge],
})
export class Profil implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private utilisateurService = inject(UtilisateurService);
  private messageService = inject(MessageService);
  readonly journalService = inject(JournalService);

  profil = signal<Utilisateur | null>(null);
  loading = signal(true);
  modeEdition = signal(false);
  enregistrement = signal(false);
  modeChangementMdp = signal(false);
  changementMdpEnCours = signal(false);
  erreurMdp = signal<string | null>(null);

  // --- Photo de profil ---
  photoApercu = signal<string | null>(null);
  televersementPhoto = signal(false);

  initiales = computed(() => {
    const p = this.profil();
    return p ? `${p.prenom[0]}${p.nom[0]}`.toUpperCase() : '';
  });

  roleLabel = computed(() => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      TECHNICIEN: 'Technicien',
      CHERCHEUR: 'Enseignant-chercheur',
      ETUDIANT: 'Étudiant',
    };
    return labels[this.profil()?.role ?? ''] ?? '';
  });

  formInfos = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: [''],
  });

  formMdp = this.fb.nonNullable.group({
    ancien_password: ['', Validators.required],
    nouveau_password: ['', [Validators.required, Validators.minLength(8)]],
    confirmation: ['', Validators.required],
  });

  ngOnInit(): void {
    this.utilisateurService.chargerMonProfil().subscribe({
      next: (p) => {
        this.profil.set(p);
        this.formInfos.patchValue({ prenom: p.prenom, nom: p.nom, telephone: p.telephone });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.journalService.chargerMonActivite();
  }

  // --- Informations personnelles ---

  ouvrirEdition(): void {
    this.modeEdition.set(true);
  }

  annulerEdition(): void {
    const p = this.profil();
    if (p) this.formInfos.patchValue({ prenom: p.prenom, nom: p.nom, telephone: p.telephone });
    this.modeEdition.set(false);
  }

  enregistrerInfos(): void {
    if (this.formInfos.invalid) {
      this.formInfos.markAllAsTouched();
      return;
    }

    this.enregistrement.set(true);
    this.utilisateurService.modifierMonProfil(this.formInfos.getRawValue()).subscribe({
      next: (maj) => {
        this.profil.set(maj);
        this.authService.mettreAJourProfilLocal(maj.nom, maj.prenom);
        this.enregistrement.set(false);
        this.modeEdition.set(false);
        this.messageService.add({ severity: 'success', summary: 'Profil mis à jour', detail: 'Vos informations ont été enregistrées.' });
      },
      error: () => {
        this.enregistrement.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour le profil.' });
      },
    });
  }

  // --- Sécurité / mot de passe ---

  ouvrirChangementMdp(): void {
    this.formMdp.reset();
    this.erreurMdp.set(null);
    this.modeChangementMdp.set(true);
  }

  annulerChangementMdp(): void {
    this.modeChangementMdp.set(false);
  }

  enregistrerMdp(): void {
    this.erreurMdp.set(null);
    const { ancien_password, nouveau_password, confirmation } = this.formMdp.getRawValue();

    if (this.formMdp.invalid) {
      this.formMdp.markAllAsTouched();
      return;
    }
    if (nouveau_password !== confirmation) {
      this.erreurMdp.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.changementMdpEnCours.set(true);
    this.authService.changerMotDePasse(ancien_password, nouveau_password).subscribe({
      next: () => {
        this.changementMdpEnCours.set(false);
        this.modeChangementMdp.set(false);
        this.messageService.add({ severity: 'success', summary: 'Mot de passe modifié', detail: 'Votre mot de passe a été mis à jour.' });
      },
      error: (err) => {
        this.changementMdpEnCours.set(false);
        this.erreurMdp.set(err.error?.detail ?? 'Une erreur est survenue.');
      },
    });
  }

  // --- Photo de profil ---

  onPhotoSelectionnee(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;

    if (!fichier.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Format invalide', detail: 'Merci de choisir une image.' });
      return;
    }

    // Aperçu immédiat, avant même la fin de l'upload — l'utilisateur voit
    // tout de suite sa photo choisie plutôt que d'attendre la réponse serveur.
    this.photoApercu.set(URL.createObjectURL(fichier));

    this.televersementPhoto.set(true);
    this.utilisateurService.televerserMaPhoto(fichier).subscribe({
      next: (maj) => {
        this.profil.set(maj);
        if (maj.photo) this.authService.mettreAJourPhotoLocale(maj.photo);
        this.televersementPhoto.set(false);
        this.messageService.add({ severity: 'success', summary: 'Photo mise à jour', detail: 'Votre photo de profil a été enregistrée.' });
      },
      error: () => {
        this.televersementPhoto.set(false);
        this.photoApercu.set(null);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "L'envoi de la photo a échoué." });
      },
    });
  }

  // --- Utilitaires d'affichage ---

  badge(action: string) {
    return badgeAction(action);
  }

  tempsEcoule(dateIso: string): string {
    const heures = Math.floor((Date.now() - new Date(dateIso).getTime()) / 3600000);
    if (heures < 1) return "À l'instant";
    if (heures < 24) return `Il y a ${heures} heure${heures > 1 ? 's' : ''}`;
    const jours = Math.floor(heures / 24);
    return `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  }
}
