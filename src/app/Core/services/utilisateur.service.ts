import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Utilisateur, UtilisateurPayload } from '../models/utilisateur.model';

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  utilisateurs = signal<Utilisateur[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  charger(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Utilisateur[]>(`${this.baseUrl}/utilisateurs/`).subscribe({
      next: (data) => { this.utilisateurs.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les utilisateurs.');
        this.loading.set(false);
      },
    });
  }

  chargerUn(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.baseUrl}/utilisateurs/${id}/`);
  }

  creer(payload: UtilisateurPayload): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.baseUrl}/utilisateurs/`, payload).pipe(
      tap(nouveau => this.utilisateurs.update(list => [nouveau, ...list]))
    );
  }

  modifier(id: number, payload: UtilisateurPayload): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.baseUrl}/utilisateurs/${id}/`, payload).pipe(
      tap(maj => this.utilisateurs.update(list => list.map(u => u.id === id ? maj : u)))
    );
  }

  activer(id: number): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.baseUrl}/utilisateurs/${id}/activer/`, {}).pipe(
      tap(maj => this.utilisateurs.update(list => list.map(u => u.id === id ? maj : u)))
    );
  }

  desactiver(id: number): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.baseUrl}/utilisateurs/${id}/desactiver/`, {}).pipe(
      tap(maj => this.utilisateurs.update(list => list.map(u => u.id === id ? maj : u)))
    );
  }
}
