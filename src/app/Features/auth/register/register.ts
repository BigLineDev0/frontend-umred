import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../Core/services/auth.service';
import { OrganisationService } from '../../../Core/services/organisation.service';
import { OrganisationPublique } from '../../../Core/models/organisation.model';
import { SelectModule } from 'primeng/select';
import { messageErreur } from '../../../Shared/utils/message-erreur';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    AuthLayout,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    RouterLink,
    SelectModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private organisationService = inject(OrganisationService);

  // Établissements clients de la plateforme : l'étudiant choisit le sien.
  organisations = signal<OrganisationPublique[]>([]);

  loading = signal(false);
  errorMessage = signal('');
  // Adresse à laquelle l'email d'activation a été envoyé : quand elle est
  // renseignée, le formulaire laisse place au message « vérifiez vos emails ».
  emailEnvoye = signal<string | null>(null);
  renvoiEnCours = signal(false);
  renvoiMessage = signal('');

  submitted = false;

  registerForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', [Validators.required]],
    organisation: [null as number | null, [Validators.required]],
  });

  ngOnInit(): void {
    this.organisationService.publiques().subscribe({
      next: (liste) => {
        this.organisations.set(liste);
        // Un seul établissement : inutile de demander.
        if (liste.length === 1) this.registerForm.patchValue({ organisation: liste[0].id });
        // Sans établissement, le formulaire restait invalide sans explication.
        if (liste.length === 0) this.errorMessage.set("Aucun établissement n'est ouvert aux inscriptions pour le moment.");
      },
      error: () => this.errorMessage.set('Impossible de charger la liste des établissements. Réessayez dans quelques instants.'),
    });
  }

  get organisation() {
    return this.registerForm.controls.organisation;
  }

  get prenom() {
    return this.registerForm.controls.prenom;
  }

  get nom() {
    return this.registerForm.controls.nom;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get passwordConfirmation() {
    return this.registerForm.controls.passwordConfirmation;
  }

  passwordsMatch(): boolean {
    return this.password.value === this.passwordConfirmation.value;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.passwordsMatch()) {
      return;
    }

    const { prenom, nom, email, password, organisation } = this.registerForm.getRawValue();
    this.loading.set(true);

    this.authService.register({ prenom, nom, email, password, organisation: organisation! }).subscribe({
      next: (reponse) => {
        this.loading.set(false);
        this.emailEnvoye.set(reponse.email);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(messageErreur(err, "Une erreur est survenue lors de l'inscription."));
      },
    });
  }

  renvoyerEmail() {
    const email = this.emailEnvoye();
    if (!email) return;

    this.renvoiEnCours.set(true);
    this.renvoiMessage.set('');
    this.authService.renvoyerActivation(email).subscribe({
      next: () => {
        this.renvoiEnCours.set(false);
        this.renvoiMessage.set('Un nouvel email vient de vous être envoyé.');
      },
      error: (err) => {
        this.renvoiEnCours.set(false);
        this.renvoiMessage.set(err.error?.detail ?? "Impossible de renvoyer l'email pour le moment.");
      },
    });
  }
}
