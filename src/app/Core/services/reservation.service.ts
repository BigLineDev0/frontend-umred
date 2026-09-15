import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation, ReservationPayload } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  reservations = signal<Reservation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

 charger(options: { all?: boolean; laboratoire?: number; aVenir?: boolean; statut?: string; dateDebut?: string; dateFin?: string; archivees?: boolean } = {}): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options.all) params = params.set('all', 'true');
    if (options.laboratoire) params = params.set('laboratoire', options.laboratoire);
    if (options.aVenir) params = params.set('a_venir', 'true');
    if (options.statut) params = params.set('statut', options.statut);

    if (options.dateDebut) params = params.set('date_debut', options.dateDebut);
    if (options.dateFin) params = params.set('date_fin', options.dateFin);
    if (options.archivees) params = params.set('archivees', 'true');

    this.http.get<Reservation[]>(`${this.baseUrl}/reservations/`, { params }).subscribe({
      next: (data) => { this.reservations.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les réservations.');
        this.loading.set(false);
      },
    });
  }

  creer(payload: ReservationPayload): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/`, payload).pipe(
      tap(nouvelle => this.reservations.update(list => [nouvelle, ...list]))
    );
  }

  annuler(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/annuler/`, {}).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }

  archiver(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/archiver/`, {}).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }

  valider(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/valider/`, {}).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }

  refuser(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/refuser/`, {}).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }
}
