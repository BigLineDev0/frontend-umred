import { Component, signal } from '@angular/core';
import { SiteHeader } from '../Shared/components/site-header/site-header';
import { SiteFooter } from '../Shared/components/site-footer/site-footer';
import { RevealDirective } from '../Shared/directives/reveal.directive';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Textarea, TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  imports: [SiteHeader, SiteFooter, RevealDirective, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule],
  selector: 'app-contact',
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact {
  nom = signal('');
  email = signal('');
  sujet = signal('');
  message = signal('');
  envoye = signal(false);
  envoiEnCours = signal(false);

  sujetOptions = [
    { label: "Demande d'accès", value: 'acces' },
    { label: 'Signalement technique', value: 'technique' },
    { label: 'Question générale', value: 'general' },
    { label: 'Partenariat', value: 'partenariat' },
  ];

  // TODO : aucun backend n'est encore branché derrière ce formulaire.
  // La façon la plus cohérente avec le reste du projet serait de
  // réutiliser un webhook n8n (même principe que les notifications de
  // réservation) plutôt qu'un endpoint Django dédié à un simple message
  // de contact — à faire quand ce sera prioritaire.
  envoyer(): void {
    if (!this.nom().trim() || !this.email().trim() || !this.message().trim()) return;

    this.envoiEnCours.set(true);
    setTimeout(() => {
      this.envoiEnCours.set(false);
      this.envoye.set(true);
      this.nom.set(''); this.email.set(''); this.sujet.set(''); this.message.set('');
    }, 700);
  }
}
