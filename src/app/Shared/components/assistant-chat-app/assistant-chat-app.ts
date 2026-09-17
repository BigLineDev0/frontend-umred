import { Component, signal, computed, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../../Core/services/assistant.service';
import { AuthService } from '../../../Core/services/auth.service';
import { ChatMessage } from '../../../Core/models/assistant.model';

interface Segment { type: 'texte' | 'liste'; lignes: string[]; }

@Component({
  selector: 'app-assistant-chat-app',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assistant-chat-app.html',
})
export class AssistantChatApp implements AfterViewChecked {
  @ViewChild('scrollZone') scrollZone?: ElementRef<HTMLDivElement>;

  private assistantService = inject(AssistantService);
  private authService = inject(AuthService);

  ouvert = signal(false);
  saisie = signal('');
  enTrainDecrire = signal(false);
  erreurConnexion = signal(false);

  suggestions = [
    'Quelles sont mes prochaines réservations ?',
    'Réserve-moi un microscope demain à 10h',
    'Quelle est la prochaine maintenance du spectrophotomètre ?',
    'Quelles sont les disponibilités du spectrophotomètre cette semaine ?',
  ];

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      texte: this.messageAccueil(),
      heure: this.heureActuelle(),
    },
  ]);

  private scrollDemande = false;

  private messageAccueil(): string {
    const prenom = this.authService.currentUser()?.prenom;
    return prenom
      ? `Bonjour ${prenom} 👋 Je peux vous aider à réserver un équipement, consulter vos réservations ou suivre une maintenance.`
      : "Bonjour 👋 Je peux vous aider à réserver un équipement, consulter vos réservations ou suivre une maintenance.";
  }

  toggle(): void { this.ouvert.update(v => !v); }
  fermer(): void { this.ouvert.set(false); }

  envoyerSuggestion(s: string): void {
    this.saisie.set(s);
    this.envoyer();
  }

  envoyer(): void {
    const texte = this.saisie().trim();
    if (!texte) return;

    this.messages.update(m => [...m, { role: 'user', texte, heure: this.heureActuelle() }]);
    this.saisie.set('');
    this.enTrainDecrire.set(true);
    this.erreurConnexion.set(false);
    this.scrollDemande = true;

    this.assistantService.envoyerMessage(texte).subscribe({
      next: (res) => {
        this.messages.update(m => [...m, { role: 'assistant', texte: res.reponse, heure: this.heureActuelle() }]);
        this.enTrainDecrire.set(false);
        this.scrollDemande = true;
      },
      error: () => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          texte: "Désolé, je n'arrive pas à vous répondre pour le moment. Vous pouvez utiliser le formulaire classique en attendant.",
          heure: this.heureActuelle(),
        }]);
        this.enTrainDecrire.set(false);
        this.erreurConnexion.set(true);
        this.scrollDemande = true;
      },
    });
  }

  // Transforme un texte brut ("- ligne 1\n- ligne 2") en segments
  // affichables proprement (paragraphes + listes à puces), plutôt que
  // du texte plat où les sauts de ligne disparaissent visuellement.
  segments(texte: string): Segment[] {
    const lignes = texte.split('\n');
    const segments: Segment[] = [];
    let listeCourante: string[] = [];

    const flush = () => {
      if (listeCourante.length) { segments.push({ type: 'liste', lignes: listeCourante }); listeCourante = []; }
    };

    for (const ligne of lignes) {
      if (ligne.trim().startsWith('- ')) {
        listeCourante.push(ligne.trim().slice(2));
      } else {
        flush();
        if (ligne.trim()) segments.push({ type: 'texte', lignes: [ligne] });
      }
    }
    flush();
    return segments;
  }

  private heureActuelle(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked(): void {
    if (this.scrollDemande && this.scrollZone) {
      this.scrollZone.nativeElement.scrollTop = this.scrollZone.nativeElement.scrollHeight;
      this.scrollDemande = false;
    }
  }
}
