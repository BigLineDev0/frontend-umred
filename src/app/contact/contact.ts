import { Component, inject, signal } from '@angular/core';
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

  envoye = signal(false);
  envoiEnCours = signal(false);

  form = this.fb.nonNullable.group({
    nom: ['', [Validators.required, nomCommun(2, 100)]],
    email: ['', [Validators.required, Validators.email]],
    sujet: [''],
    message: ['', [Validators.required, texteLong({ min: 10, max: 2000, obligatoire: true })]],
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

  // TODO : aucun backend n'est encore branché derrière ce formulaire.
  // La façon la plus cohérente avec le reste du projet serait de
  // réutiliser un webhook n8n (même principe que les notifications de
  // réservation) plutôt qu'un endpoint Django dédié à un simple message
  // de contact — à faire quand ce sera prioritaire.
  envoyer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.envoiEnCours.set(true);
    setTimeout(() => {
      this.envoiEnCours.set(false);
      this.envoye.set(true);
      this.form.reset({ nom: '', email: '', sujet: '', message: '' });
    }, 700);
  }
}
