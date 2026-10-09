import { Component, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssistantService } from '../../../Core/services/assistant.service';
import { AuthService } from '../../../Core/services/auth.service';
import {
  BlocTexte, ChatMessage, ChatOption, ChatResponse, CreneauLibre, ReservationResume,
} from '../../../Core/models/assistant.model';
import { HttpErrorResponse } from '@angular/common/http';
import { messageErreur } from '../../utils/message-erreur';
import { StatusBadge } from '../status-badge';
import { decouperTexte, genreOptions } from './mise-en-forme';

// Une route interne commence par un seul « / » : tout lien externe ou
// « //domaine » est ignoré, même si le service IA en renvoyait un.
const ROUTE_INTERNE = /^\/(?!\/)[A-Za-z0-9/_-]*$/;


@Component({
  selector: 'app-assistant-chat-app',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, StatusBadge],
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
    'Quelles sont mes prochaines réservations ?',
  ];

  messages = signal<ChatMessage[]>([]);

  private scrollDemande = false;

  ngOnInit(): void {
    // Le message d'accueil vient d'un endpoint dédié (GET /chat/accueil),
    // pas du pipeline conversationnel — il se déclenche à l'ouverture,
    // pas en réponse à un message de l'utilisateur.
    this.assistantService.chargerAccueil().subscribe({
      next: (res) => this.afficherAccueil(res.reponse),
      // Filet de sécurité si FastAPI ou Django est momentanément
      // indisponible : un message générique plutôt qu'un panneau vide.
      error: () => this.afficherAccueil(this.messageAccueilGenerique()),
    });
  }

  // L'accueil se place en tête SANS écraser la conversation : un utilisateur
  // rapide a pu envoyer un message avant la réponse de /chat/accueil.
  private afficherAccueil(texte: string): void {
    const accueil: ChatMessage = { role: 'assistant', texte, blocs: this.decouper(texte), heure: this.heureActuelle() };
    this.messages.update(m => [accueil, ...m]);
    this.chargementAccueil.set(false);
  }

  private messageAccueilGenerique(): string {
    const prenom = this.authService.currentUser()?.prenom;
    return prenom
      ? `Bonjour ${prenom}. Je peux vous aider à réserver un équipement, consulter vos réservations ou suivre une maintenance.`
      : "Bonjour. Je peux vous aider à réserver un équipement, consulter vos réservations ou suivre une maintenance.";
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
      next: (res) => this.ajouterReponse(this.versMessage(res)),
      error: (err: HttpErrorResponse) => {
        // 429 : quota de messages atteint, ce n'est pas une panne du service.
        const tropDeMessages = err.status === 429;
        this.erreurConnexion.set(!tropDeMessages);
        this.ajouterReponse({
          role: 'assistant',
          type: tropDeMessages ? 'message' : 'error',
          texte: tropDeMessages
            ? messageErreur(err)
            : "Désolé, je n'arrive pas à vous répondre pour le moment. Vous pouvez utiliser le formulaire classique en attendant.",
          heure: this.heureActuelle(),
        });
      },
    });
  }

  // Traduit la réponse structurée du service IA en message affichable :
  // boutons de navigation, cartes de réservations, créneaux libres.
  private versMessage(res: ChatResponse): ChatMessage {
    const data = res.data;
    return {
      role: 'assistant', texte: res.reponse, heure: this.heureActuelle(), type: res.type,
      blocs: decouperTexte(res.reponse),
      options: res.options, genreOptions: genreOptions(res), details_confirmation: res.details_confirmation,
      actions: (res.actions ?? []).filter(a => a.type === 'navigate' && ROUTE_INTERNE.test(a.route)),
      reservations: res.type === 'reservations' && Array.isArray(data) ? data as ReservationResume[] : undefined,
      creneaux: res.type === 'availability' ? this.creneauxDe(data) : undefined,
    };
  }

  // Puces de créneaux uniquement pour UNE journée : sur plusieurs jours,
  // le texte reste plus fidèle (il mentionne aussi les jours sans créneau).
  private creneauxDe(data: unknown): CreneauLibre[] | undefined {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const creneaux = (data as { creneaux?: unknown }).creneaux;
      if (Array.isArray(creneaux) && creneaux.length) {
        const liste = creneaux as CreneauLibre[];
        const jours = new Set(liste.map(c => c.date ?? ''));
        return jours.size === 1 ? liste : undefined;
      }
    }
    return undefined;
  }

  // Après un clic sur un lien interne : sur mobile, le panneau couvrirait
  // la page ouverte, on le referme.
  apresNavigation(): void {
    if (window.matchMedia('(max-width: 767px)').matches) this.fermer();
  }

  // Quand les données sont affichées en cartes ou en créneaux, les lignes
  // « - ... » du texte feraient doublon : seul le texte d'introduction reste.
  aDesDonnees(m: ChatMessage): boolean {
    return !!(m.reservations?.length || m.creneaux?.length);
  }

  heureCourte(heure: string): string {
    const [h, min] = heure.slice(0, 5).split(':');
    return `${Number(h)}h${min === '00' ? '' : min}`;
  }

  private ajouterReponse(message: ChatMessage): void {
    this.messages.update(m => [...m, message]);
    this.enTrainDecrire.set(false);
    this.scrollDemande = true;
  }

  // Utilisée par le template pour les messages sans blocs pré-calculés.
  decouper(texte: string): BlocTexte[] {
    return decouperTexte(texte);
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
