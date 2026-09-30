import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { AuthService } from '../../../Core/services/auth.service';

// Page ouverte depuis le lien reçu par email après l'inscription :
// l'activation est lancée automatiquement à l'ouverture.
@Component({
  standalone: true,
  selector: 'app-activer-compte',
  templateUrl: './activer-compte.html',
  imports: [AuthLayout, ReactiveFormsModule, ButtonModule, InputTextModule, RouterLink],
})
export class ActiverCompte implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  etat = signal<'en_cours' | 'active' | 'invalide'>('en_cours');
  message = signal('');

  // Formulaire de renvoi, proposé quand le lien est expiré ou invalide.
  renvoiForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  renvoiEnCours = signal(false);
  renvoiMessage = signal('');

  get email() {
    return this.renvoiForm.controls.email;
  }

  ngOnInit(): void {
    const jeton = this.route.snapshot.paramMap.get('jeton') ?? '';
    if (!jeton) {
      this.etat.set('invalide');
      this.message.set("Lien d'activation invalide.");
      return;
    }

    this.authService.activerCompte(jeton).subscribe({
      next: (res) => {
        this.etat.set('active');
        this.message.set(res.detail);
      },
      error: (err) => {
        this.etat.set('invalide');
        this.message.set(err.error?.detail ?? "Ce lien d'activation n'est plus valable.");
      },
    });
  }

  allerALaConnexion(): void {
    this.router.navigate(['/connexion']);
  }

  renvoyer(): void {
    this.renvoiMessage.set('');
    if (this.renvoiForm.invalid) {
      this.renvoiForm.markAllAsTouched();
      return;
    }

    this.renvoiEnCours.set(true);
    this.authService.renvoyerActivation(this.email.value).subscribe({
      next: (res) => {
        this.renvoiEnCours.set(false);
        this.renvoiMessage.set(res.detail);
      },
      error: (err) => {
        this.renvoiEnCours.set(false);
        this.renvoiMessage.set(err.error?.detail ?? "Impossible de renvoyer l'email pour le moment.");
      },
    });
  }
}
