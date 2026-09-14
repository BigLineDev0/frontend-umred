import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Laboratoire, LaboratoirePayload } from '../models/laboratoire.model';

@Injectable({ providedIn: 'root' })
export class LaboratoireService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  laboratoires = signal<Laboratoire[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  charger(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Laboratoire[]>(`${this.baseUrl}/laboratoires/`).subscribe({
      next: (data) => { this.laboratoires.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les laboratoires.');
        this.loading.set(false);
      },
    });
  }

  // Chargement direct par id, indépendant de la liste déjà en mémoire —
  // nécessaire pour que la page détail fonctionne même en accès direct
  // par URL (rechargement de page), sans dépendre d'un chargement préalable.
  chargerUn(id: number): Observable<Laboratoire> {
    return this.http.get<Laboratoire>(`${this.baseUrl}/laboratoires/${id}/`);
  }

  creer(payload: LaboratoirePayload): Observable<Laboratoire> {
    return this.http.post<Laboratoire>(`${this.baseUrl}/laboratoires/`, payload).pipe(
      tap(nouveau => this.laboratoires.update(list => [...list, nouveau]))
    );
  }

  modifier(id: number, payload: LaboratoirePayload): Observable<Laboratoire> {
    return this.http.patch<Laboratoire>(`${this.baseUrl}/laboratoires/${id}/`, payload).pipe(
      tap(maj => this.laboratoires.update(list => list.map(l => l.id === id ? maj : l)))
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/laboratoires/${id}/`).pipe(
      tap(() => this.laboratoires.update(list => list.filter(l => l.id !== id)))
    );
  }
}
