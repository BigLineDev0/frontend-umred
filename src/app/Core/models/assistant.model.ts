export interface ChatMessage {
  role: 'user' | 'assistant';
  texte: string;
  heure: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  reponse: string;
  intention: string | null;
  necessite_confirmation: boolean;
}
