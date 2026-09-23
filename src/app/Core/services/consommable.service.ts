import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Consommable, ConsommablePayload, MouvementStock, AlerteConsommable } from '../models/consommable.model';

@Injectable({ providedIn: 'root' })
export class ConsommableService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  consommables = signal<Consommable[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  alertesActives = signal<AlerteConsommable[]>([]);

  charger(options: { laboratoire?: number; statut?: string } = {}): void {
    this.loading.set(true);
    this.error.set(null);
    let params = new HttpParams();
    if (options.laboratoire) params = params.set('laboratoire', options.laboratoire);
    if (options.statut) params = params.set('statut', options.statut);

    this.http.get<Consommable[]>(`${this.baseUrl}/consommables/`, { params }).subscribe({
      next: (data) => { this.consommables.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les consommables.');
        this.loading.set(false);
      },
    });
  }

  chargerUn(id: number): Observable<Consommable> {
    return this.http.get<Consommable>(`${this.baseUrl}/consommables/${id}/`);
  }

  chargerAlertes(): void {
    this.http.get<AlerteConsommable[]>(`${this.baseUrl}/consommables/alertes_actives/`).subscribe({
      next: (data) => this.alertesActives.set(data),
      error: () => this.alertesActives.set([]),
    });
  }

  chargerMouvements(id: number): Observable<MouvementStock[]> {
    return this.http.get<MouvementStock[]>(`${this.baseUrl}/consommables/${id}/mouvements/`);
  }

  creer(payload: ConsommablePayload): Observable<Consommable> {
    return this.http.post<Consommable>(`${this.baseUrl}/consommables/`, payload).pipe(
      tap(nouveau => this.consommables.update(list => [...list, nouveau]))
    );
  }

  modifier(id: number, payload: ConsommablePayload): Observable<Consommable> {
    return this.http.patch<Consommable>(`${this.baseUrl}/consommables/${id}/`, payload).pipe(
      tap(maj => this.consommables.update(list => list.map(c => c.id === id ? maj : c)))
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/consommables/${id}/`).pipe(
      tap(() => this.consommables.update(list => list.filter(c => c.id !== id)))
    );
  }

  retirer(id: number, quantite: number, motif: string): Observable<Consommable> {
    return this.http.post<Consommable>(`${this.baseUrl}/consommables/${id}/retirer/`, { quantite, motif }).pipe(
      tap(maj => this.consommables.update(list => list.map(c => c.id === id ? maj : c)))
    );
  }

  reapprovisionner(id: number, quantite: number, motif: string): Observable<Consommable> {
    return this.http.post<Consommable>(`${this.baseUrl}/consommables/${id}/reapprovisionner/`, { quantite, motif }).pipe(
      tap(maj => this.consommables.update(list => list.map(c => c.id === id ? maj : c)))
    );
  }
}
