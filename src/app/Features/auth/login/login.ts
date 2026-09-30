import { Component, inject, signal } from '@angular/core';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../../Core/services/auth.service';

@Component({
  imports: [
    AuthLayout,
    ReactiveFormsModule,
    InputText,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule,
    RouterLink,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  submitted = false;
  errorMessage = signal('');
  // Compte inscrit mais adresse email pas encore confirmée : on propose
  // de renvoyer le lien d'activation.
  emailNonVerifie = signal(false);
  renvoiEnCours = signal(false);
  renvoiMessage = signal('');

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage.set('');
    this.emailNonVerifie.set(false);
    this.renvoiMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.loading.set(true);

    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.authService.redirigerSelonRole();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail ?? 'Identifiants incorrects.');
        this.emailNonVerifie.set(err.error?.code === 'email_non_verifie');
      },
    });
  }

  renvoyerActivation() {
    this.renvoiEnCours.set(true);
    this.renvoiMessage.set('');
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
