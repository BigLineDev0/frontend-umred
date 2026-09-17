import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  texte: string;
  heure: string;
}

@Component({
  selector: 'app-assistant-chat',
  standalone: true,
  imports: [FormsModule, ButtonModule],
  templateUrl: './assistant-chat.html',
})
export class AssistantChat implements AfterViewChecked {
  @ViewChild('scrollZone') scrollZone?: ElementRef<HTMLDivElement>;

  ouvert = signal(false);
  saisie = signal('');
  enTrainDecrire = signal(false);

  suggestions = [
    'Quels équipements sont disponibles ?',
    'Comment réserver un équipement ?',
    'Comment fonctionne la maintenance ?',
    'Comment créer un compte ?',
  ];

  messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      texte: "Bonjour 👋 Je suis l'assistant UMRED Labo. Posez-moi une question sur nos laboratoires, équipements ou le fonctionnement de la plateforme.",
      heure: this.heureActuelle(),
    },
  ]);

  private scrollDemande = false;

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
    this.scrollDemande = true;

    // TODO : remplacer cette simulation par un appel au service IA (FastAPI)
    // une fois la brique connectée. L'assistant interrogera alors les vraies
    // API (réservations, équipements, maintenance) pour l'utilisateur connecté,
    // au lieu de cette réponse démonstrative basée sur des mots-clés.
    setTimeout(() => {
      this.messages.update(m => [...m, { role: 'assistant', texte: this.genererReponse(texte), heure: this.heureActuelle() }]);
      this.enTrainDecrire.set(false);
      this.scrollDemande = true;
    }, 900);
  }

  private genererReponse(question: string): string {
    const q = question.toLowerCase();

    if (q.includes('annul')) {
      return "L'annulation d'une réservation se fait en un clic depuis votre espace personnel une fois connecté. Sur la plateforme, dites-moi simplement « Annule ma réservation de vendredi à 10h » et je m'en occupe pour vous.";
    }
    if (q.includes('réserv')) {
      return "Une fois connecté, vous pourrez me demander directement « Réserve-moi le microscope demain à 14h pendant deux heures » — je vérifie la disponibilité et confirme la réservation pour vous, sans passer par un formulaire.";
    }
    if (q.includes('maintenance')) {
      return "Je peux vous indiquer la prochaine maintenance planifiée sur un équipement précis une fois connecté, par exemple « Quelle est la prochaine maintenance du spectrophotomètre ? ».";
    }
    if (q.includes('dispon') || q.includes('équipement') || q.includes('equipement')) {
      return "UMRED Labo centralise tout le parc d'équipements des laboratoires : microscopes, centrifugeuses, spectrophotomètres, thermocycleurs PCR... Connecté, vous pouvez me demander « Quels équipements sont disponibles demain matin ? » pour une réponse en temps réel.";
    }
    if (q.includes('compte') || q.includes('inscri')) {
      return "Les étudiants créent leur compte directement depuis la plateforme. Les enseignants-chercheurs et techniciens reçoivent leurs identifiants par email, créés par l'administrateur du laboratoire.";
    }
    if (q.includes('statistique') || q.includes('combien')) {
      return "Une fois connecté, je peux répondre à des questions comme « Combien de réservations ai-je effectuées ce mois-ci ? » en croisant vos données de réservation.";
    }
    return "Je suis pour l'instant en mode démonstration sur cette page. Une fois connecté à la plateforme, je pourrai consulter vos équipements, gérer vos réservations et suivre vos maintenances directement depuis cette conversation.";
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
