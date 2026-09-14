import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../Core/services/auth.service';

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
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = signal(false);
  errorMessage = signal('');

  submitted = false;

  registerForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', [Validators.required]],
  });

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

    const { prenom, nom, email, password } = this.registerForm.getRawValue();
    this.loading.set(true);

    this.authService.register({ prenom, nom, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.authService.redirigerSelonRole();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.email?.[0] ?? "Une erreur est survenue lors de l'inscription.",
        );
      },
    });
  }
}
