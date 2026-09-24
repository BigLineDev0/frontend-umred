import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatRequest, ChatResponse } from '../models/assistant.model';

const CLE_SESSION = 'assistant_session_id';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private http = inject(HttpClient);

  // Un id de session stable tant que l'onglet reste ouvert — permet à
  // FastAPI de retrouver l'état "en attente de confirmation" entre deux
  // messages, sans qu'Angular ait à gérer cet état lui-même.
  private sessionId = this.recupererOuCreerSessionId();

  private recupererOuCreerSessionId(): string {
    let id = sessionStorage.getItem(CLE_SESSION);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(CLE_SESSION, id);
    }
    return id;
  }

  envoyerMessage(message: string): Observable<ChatResponse> {
    const payload: ChatRequest = { session_id: this.sessionId, message };
    return this.http.post<ChatResponse>(`${environment.aiApiUrl}/chat`, payload);
  }

  chargerAccueil(): Observable<ChatResponse> {
    return this.http.get<ChatResponse>(`${environment.aiApiUrl}/chat/accueil`);
  }
}
