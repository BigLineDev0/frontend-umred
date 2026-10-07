export interface ChatOption {
  label: string;
  value: string;
}

export interface DetailsConfirmation {
  laboratoire?: string;
  equipement?: string;
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
}

// Lien interne proposé par l'assistant (ex. « Ajouter un équipement »).
// La route est choisie par le service IA dans un catalogue des routes de
// l'application, filtré selon le rôle — jamais générée par le modèle.
export interface ChatAction {
  type: 'navigate';
  label: string;
  route: string;
}

export type TypeReponse =
  | 'message' | 'navigation' | 'clarification' | 'confirmation' | 'availability'
  | 'reservations' | 'reservation' | 'maintenance' | 'statistics' | 'denied' | 'error';

export interface ReservationResume {
  id: number;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' | 'ANNULEE' | 'TERMINEE';
  statut_libelle: string;
  laboratoire?: string;
  equipements: string[];
  motif_refus?: string | null;
}

export interface CreneauLibre {
  date?: string;
  debut: string;
  fin: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  texte: string;
  heure: string;
  type?: TypeReponse;
  options?: ChatOption[];
  details_confirmation?: DetailsConfirmation;
  actions?: ChatAction[];
  reservations?: ReservationResume[];
  creneaux?: CreneauLibre[];
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  reponse: string;
  type?: TypeReponse;
  intention: string | null;
  necessite_confirmation: boolean;
  options?: ChatOption[];
  details_confirmation?: DetailsConfirmation;
  actions?: ChatAction[] | null;
  // Données issues de Django ; leur forme dépend de `type`.
  data?: unknown;
}
