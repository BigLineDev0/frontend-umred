import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthLayout } from '../../../Layout/auth-layout/auth-layout';
import { AuthService } from '../../../Core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-definir-mot-de-passe',
  templateUrl: './definir-mot-de-passe.html',
  imports: [AuthLayout, ReactiveFormsModule, ButtonModule, PasswordModule, RouterLink],
})
export class DefinirMotDePasse implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  verification = signal<'en_cours' | 'valide' | 'invalide'>('en_cours');
  prenom = signal('');
  submitted = false;
  loading = signal(false);
  erreur = signal<string | null>(null);
  succes = signal(false);

  private jeton = '';

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirmation: ['', Validators.required],
  });

  get password() { return this.form.controls.password; }
  get passwordConfirmation() { return this.form.controls.passwordConfirmation; }

  ngOnInit(): void {
    this.jeton = this.route.snapshot.paramMap.get('jeton') ?? '';
    if (!this.jeton) {
      this.verification.set('invalide');
      return;
    }

    this.authService.verifierJeton(this.jeton).subscribe({
      next: (res) => {
        this.verification.set(res.valide ? 'valide' : 'invalide');
        this.prenom.set(res.prenom ?? '');
      },
      error: () => this.verification.set('invalide'),
    });
  }

  passwordsMatch(): boolean {
    return this.password.value === this.passwordConfirmation.value;
  }

  onSubmit(): void {
    this.submitted = true;
    this.erreur.set(null);

    if (this.form.invalid || !this.passwordsMatch()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService.definirMotDePasse(this.jeton, this.password.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.succes.set(true);
        setTimeout(() => this.router.navigate(['/connexion']), 2500);
      },
      error: (err) => {
        this.loading.set(false);
        this.erreur.set(err.error?.detail ?? 'Une erreur est survenue.');
      },
    });
  }
}
