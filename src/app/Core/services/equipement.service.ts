import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlerteUsure, AlerteUsureGlobale, Equipement, EquipementPayload } from '../models/equipement.model';

@Injectable({ providedIn: 'root' })
export class EquipementService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  equipements = signal<Equipement[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  charger(options: { search?: string; laboratoire?: number; statut?: string } = {}): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options.search) params = params.set('search', options.search);
    if (options.laboratoire) params = params.set('laboratoire', options.laboratoire);
    if (options.statut) params = params.set('statut', options.statut);

    this.http.get<Equipement[]>(`${this.baseUrl}/equipements/`, { params }).subscribe({
      next: (data) => { this.equipements.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les équipements.');
        this.loading.set(false);
      },
    });
  }


  chargerParLaboratoire(laboratoireId: number): void {
    this.charger({ laboratoire: laboratoireId });
  }

  chargerUn(id: number): Observable<Equipement> {
    return this.http.get<Equipement>(`${this.baseUrl}/equipements/${id}/`);
  }

  chargerEnPanne(): void {
    this.charger({ statut: 'EN_PANNE' });
  }

  creer(payload: EquipementPayload): Observable<Equipement> {
    return this.http.post<Equipement>(`${this.baseUrl}/equipements/`, payload).pipe(
      tap(nouveau => this.equipements.update(list => [...list, nouveau]))
    );
  }

  modifier(id: number, payload: EquipementPayload): Observable<Equipement> {
    return this.http.patch<Equipement>(`${this.baseUrl}/equipements/${id}/`, payload).pipe(
      tap(maj => this.equipements.update(list => list.map(e => e.id === id ? maj : e)))
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/equipements/${id}/`).pipe(
      tap(() => this.equipements.update(list => list.filter(e => e.id !== id)))
    );
  }

  vider(): void {
    this.equipements.set([]);
  }

  televerserManuel(id: number, fichier: File): Observable<Equipement> {
    const formData = new FormData();
    formData.append('manuel_pdf', fichier);
    // Ne jamais fixer manuellement le Content-Type ici : le navigateur doit
    // générer lui-même la frontière multipart (boundary), sinon Django ne
    // parvient pas à parser correctement le fichier envoyé.
    return this.http.patch<Equipement>(`${this.baseUrl}/equipements/${id}/`, formData).pipe(
      tap(maj => this.equipements.update(list => list.map(e => e.id === id ? maj : e)))
    );
  }

  alertesUsureActives = signal<AlerteUsureGlobale[]>([]);

chargerAlertesUsure(): void {
  this.http.get<AlerteUsureGlobale[]>(`${this.baseUrl}/equipements/alertes_usure_actives/`).subscribe({
    next: (data) => this.alertesUsureActives.set(data),
    error: () => this.alertesUsureActives.set([]),
  });
}

chargerAlerteUsure(equipementId: number): Observable<AlerteUsure> {
  return this.http.get<AlerteUsure>(`${this.baseUrl}/equipements/${equipementId}/alerte_usure/`);
}
}
