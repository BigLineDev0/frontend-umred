import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { AuthService } from '../../../Core/services/auth.service';

const DELAI_RENVOI_SECONDES = 30;

@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [AuthLayout, ReactiveFormsModule, RouterLink, ButtonModule, InputText, IconFieldModule, InputIconModule],
  templateUrl: './mot-de-passe-oublie.html',
})
export class MotDePasseOublie implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  envoye = signal(false);
  erreur = signal<string | null>(null);
  // Anti-spam côté interface : on ne peut pas renvoyer l'e-mail en boucle.
  secondesAvantRenvoi = signal(0);
  submitted = false;

  private minuteur?: ReturnType<typeof setInterval>;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() { return this.form.controls.email; }

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.minuteur));
  }

  ngOnInit(): void {
    // Pré-rempli avec l'e-mail déjà saisi sur la page de connexion (transmis via
    // l'état de navigation, pour ne pas l'exposer dans l'URL).
    const emailTransmis = history.state?.email;
    if (typeof emailTransmis === 'string') this.email.setValue(emailTransmis);
  }

  onSubmit(): void {
    this.submitted = true;
    this.erreur.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.envoyer();
  }

  renvoyer(): void {
    if (this.secondesAvantRenvoi() > 0 || this.loading()) return;
    this.envoyer();
  }

  modifierEmail(): void {
    this.envoye.set(false);
    this.submitted = false;
  }

  private envoyer(): void {
    this.loading.set(true);
    this.authService.demanderReinitialisation(this.email.value.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.envoye.set(true);
        this.demarrerMinuteur();
      },
      error: (err) => {
        this.loading.set(false);
        this.erreur.set(err.error?.detail ?? "L'envoi a échoué. Veuillez réessayer dans quelques instants.");
      },
    });
  }

  private demarrerMinuteur(): void {
    clearInterval(this.minuteur);
    this.secondesAvantRenvoi.set(DELAI_RENVOI_SECONDES);
    this.minuteur = setInterval(() => {
      this.secondesAvantRenvoi.update(s => s - 1);
      if (this.secondesAvantRenvoi() <= 0) clearInterval(this.minuteur);
    }, 1000);
  }
}
