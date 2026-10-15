import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { messageErreur } from '../Shared/utils/message-erreur';
import { SiteHeader } from '../Shared/components/site-header/site-header';
import { SiteFooter } from '../Shared/components/site-footer/site-footer';
import { RevealDirective } from '../Shared/directives/reveal.directive';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { messageErreurChamp, nomCommun, texteLong } from '../Shared/validators/validators';

@Component({
  imports: [SiteHeader, SiteFooter, RevealDirective, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule],
  selector: 'app-contact',
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  envoye = signal(false);
  envoiEnCours = signal(false);
  erreur = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nom: ['', [Validators.required, nomCommun(2, 100)]],
    email: ['', [Validators.required, Validators.email]],
    sujet: [''],
    message: ['', [Validators.required, texteLong({ min: 10, max: 2000, obligatoire: true })]],
    // Champ piège invisible : seul un robot le remplit.
    site_web: [''],
  });

  sujetOptions = [
    { label: "Demande d'accès", value: 'acces' },
    { label: 'Signalement technique', value: 'technique' },
    { label: 'Question générale', value: 'general' },
    { label: 'Partenariat', value: 'partenariat' },
  ];

  getFieldError(nom: string): string {
    return messageErreurChamp(this.form.get(nom));
  }

  isFieldInvalid(nom: string): boolean {
    const c = this.form.get(nom);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  envoyer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valeurs = this.form.getRawValue();
    this.envoiEnCours.set(true);
    this.erreur.set(null);
    this.http.post(`${environment.apiUrl}/contact/`, { ...valeurs, sujet: valeurs.sujet || 'general' }).subscribe({
      next: () => {
        this.envoiEnCours.set(false);
        this.envoye.set(true);
        this.form.reset({ nom: '', email: '', sujet: '', message: '', site_web: '' });
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.erreur.set(messageErreur(err, "Le message n'a pas pu être envoyé. Réessayez plus tard."));
      },
    });
  }
}
