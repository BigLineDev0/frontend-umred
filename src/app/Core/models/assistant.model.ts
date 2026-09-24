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

export interface ChatMessage {
  role: 'user' | 'assistant';
  texte: string;
  heure: string;
  options?: ChatOption[];
  details_confirmation?: DetailsConfirmation;
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  reponse: string;
  intention: string | null;
  necessite_confirmation: boolean;
  options?: ChatOption[];
  details_confirmation?: DetailsConfirmation;
}
