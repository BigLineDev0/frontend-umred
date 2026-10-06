import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlerteCreneau, AlerteCreneauPayload, DemandeEnAttente, EvenementReservation, Reservation, ReservationPayload,
  VerificationReservation,
} from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  reservations = signal<Reservation[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // all : toutes les réservations (admin) ; traitees : celles sur lesquelles
  // j'ai statué ; archivees : true les inclut, 'only' n'affiche qu'elles.
  charger(options: {
    all?: boolean; traitees?: boolean; laboratoire?: number; aVenir?: boolean; statut?: string;
    dateDebut?: string; dateFin?: string; archivees?: boolean | 'only';
  } = {}): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options.all) params = params.set('all', 'true');
    if (options.traitees) params = params.set('traitees', 'true');
    if (options.laboratoire) params = params.set('laboratoire', options.laboratoire);
    if (options.aVenir) params = params.set('a_venir', 'true');
    if (options.statut) params = params.set('statut', options.statut);

    if (options.dateDebut) params = params.set('date_debut', options.dateDebut);
    if (options.dateFin) params = params.set('date_fin', options.dateFin);
    if (options.archivees) params = params.set('archivees', options.archivees === 'only' ? 'only' : 'true');

    this.http.get<Reservation[]>(`${this.baseUrl}/reservations/`, { params }).subscribe({
      next: (data) => { this.reservations.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les réservations.');
        this.loading.set(false);
      },
    });
  }

  verifier(payload: ReservationPayload): Observable<VerificationReservation> {
    return this.http.post<VerificationReservation>(`${this.baseUrl}/reservations/verifier/`, payload);
  }

  fileAttente(): Observable<DemandeEnAttente[]> {
    return this.http.get<DemandeEnAttente[]>(`${this.baseUrl}/reservations/file_attente/`);
  }

  mesAlertes(): Observable<AlerteCreneau[]> {
    return this.http.get<AlerteCreneau[]>(`${this.baseUrl}/reservations/alertes/`);
  }

  creerAlerte(payload: AlerteCreneauPayload): Observable<AlerteCreneau> {
    return this.http.post<AlerteCreneau>(`${this.baseUrl}/reservations/alertes/`, payload);
  }

  supprimerAlerte(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reservations/alertes/${id}/supprimer/`, {});
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

  // Archiver ou restaurer fait changer la réservation de liste : elle quitte
  // la liste affichée (active ou archives) au lieu d'y rester modifiée.
  archiver(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/archiver/`, {}).pipe(
      tap(() => this.retirer(id))
    );
  }

  desarchiver(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/desarchiver/`, {}).pipe(
      tap(() => this.retirer(id))
    );
  }

  historique(id: number): Observable<EvenementReservation[]> {
    return this.http.get<EvenementReservation[]>(`${this.baseUrl}/reservations/${id}/historique/`);
  }

  private retirer(id: number): void {
    this.reservations.update(list => list.filter(r => r.id !== id));
  }

  valider(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/valider/`, {}).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }

  refuser(id: number, motif = ''): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.baseUrl}/reservations/${id}/refuser/`, { motif }).pipe(
      tap(maj => this.reservations.update(list => list.map(r => r.id === id ? maj : r)))
    );
  }
}
