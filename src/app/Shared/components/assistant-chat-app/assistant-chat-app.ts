import { Component, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssistantService } from '../../../Core/services/assistant.service';
import { AuthService } from '../../../Core/services/auth.service';
import { ChatMessage, ChatOption } from '../../../Core/models/assistant.model';

interface Segment { type: 'texte' | 'liste'; lignes: string[]; }

@Component({
  selector: 'app-assistant-chat-app',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assistant-chat-app.html',
})
export class AssistantChatApp implements OnInit, AfterViewChecked {
  @ViewChild('scrollZone') scrollZone?: ElementRef<HTMLDivElement>;

  private assistantService = inject(AssistantService);
  private authService = inject(AuthService);

  ouvert = signal(false);
  saisie = signal('');
  enTrainDecrire = signal(false);
  erreurConnexion = signal(false);
  chargementAccueil = signal(true);

  suggestions = [
    'Quels équipements sont disponibles ?',
    'Réserve-moi un microscope demain à 10h',
    'Quelle est la prochaine maintenance du spectrophotomètre ?',
    'Quelles sont mes prochaines réservations ?',
  ];

  messages = signal<ChatMessage[]>([]);

  private scrollDemande = false;

  ngOnInit(): void {
    // Le message d'accueil vient d'un endpoint dédié (GET /chat/accueil),
    // pas du pipeline conversationnel — il se déclenche à l'ouverture,
    // pas en réponse à un message de l'utilisateur.
    this.assistantService.chargerAccueil().subscribe({
      next: (res) => {
        this.messages.set([{ role: 'assistant', texte: res.reponse, heure: this.heureActuelle() }]);
        this.chargementAccueil.set(false);
      },
      error: () => {
        // Filet de sécurité si FastAPI ou Django est momentanément
        // indisponible : un message générique plutôt qu'un panneau vide.
        this.messages.set([{ role: 'assistant', texte: this.messageAccueilGenerique(), heure: this.heureActuelle() }]);
        this.chargementAccueil.set(false);
      },
    });
  }

  private messageAccueilGenerique(): string {
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
    if (!texte || this.enTrainDecrire()) return;
    this.saisie.set('');
    this.echanger(texte, texte);
  }

  // Un clic sur une option (choix d'équipement, alternative, oui/non)
  // envoie sa VALEUR cachée au backend, mais affiche son LIBELLÉ lisible
  // dans la bulle utilisateur — la même mécanique que taper au clavier.
  selectionnerOption(option: ChatOption): void {
    if (this.enTrainDecrire()) return;
    this.echanger(option.value, option.label);
  }

  // Tronc commun des deux modes d'envoi. Les boutons des réponses
  // précédentes sont retirés : une fois la conversation avancée, ils ne
  // correspondent plus à l'étape attendue par le serveur.
  private echanger(valeurEnvoyee: string, texteAffiche: string): void {
    this.messages.update(m => [
      ...m.map(msg => ({ ...msg, options: undefined })),
      { role: 'user' as const, texte: texteAffiche, heure: this.heureActuelle() },
    ]);
    this.enTrainDecrire.set(true);
    this.erreurConnexion.set(false);
    this.scrollDemande = true;

    this.assistantService.envoyerMessage(valeurEnvoyee).subscribe({
      next: (res) => {
        this.ajouterReponse({
          role: 'assistant', texte: res.reponse, heure: this.heureActuelle(),
          options: res.options, details_confirmation: res.details_confirmation,
        });
      },
      error: () => {
        this.erreurConnexion.set(true);
        this.ajouterReponse({
          role: 'assistant',
          texte: "Désolé, je n'arrive pas à vous répondre pour le moment. Vous pouvez utiliser le formulaire classique en attendant.",
          heure: this.heureActuelle(),
        });
      },
    });
  }

  private ajouterReponse(message: ChatMessage): void {
    this.messages.update(m => [...m, message]);
    this.enTrainDecrire.set(false);
    this.scrollDemande = true;
  }

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
