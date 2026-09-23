import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Maintenance, MaintenancePayload } from '../models/maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  maintenances = signal<Maintenance[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  charger(options: { statut?: string; type?: string; equipement?: number; dateDebut?: string; dateFin?: string } = {}): void {
    this.loading.set(true);
    this.error.set(null);
    let params = new HttpParams();
    if (options.statut) params = params.set('statut', options.statut);
    if (options.type) params = params.set('type', options.type);
    if (options.equipement) params = params.set('equipement', options.equipement);
    if (options.dateDebut) params = params.set('date_debut', options.dateDebut);
    if (options.dateFin) params = params.set('date_fin', options.dateFin);

    this.http.get<Maintenance[]>(`${this.baseUrl}/maintenances/`, { params }).subscribe({
      next: (data) => { this.maintenances.set(data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Impossible de charger les maintenances.');
        this.loading.set(false);
      },
    });
  }

  chargerParEquipement(equipementId: number): void {
    this.charger({ equipement: equipementId });
  }

  chargerUne(id: number): Observable<Maintenance> {
    return this.http.get<Maintenance>(`${this.baseUrl}/maintenances/${id}/`);
  }

  prendreEnCharge(id: number, datePlanifiee: string): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/${id}/prendre_en_charge/`, {
      date_planifiee: datePlanifiee,
    }).pipe(
      tap(maj => this.maintenances.update(list => list.map(m => m.id === id ? maj : m)))
    );
  }

  creer(payload: MaintenancePayload): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/`, payload).pipe(
      tap(nouvelle => this.maintenances.update(list => [nouvelle, ...list]))
    );
  }

  demarrer(id: number): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/${id}/demarrer/`, {}).pipe(
      tap(maj => this.maintenances.update(list => list.map(m => m.id === id ? maj : m)))
    );
  }

  cloturer(id: number, rapport: string): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/${id}/cloturer/`, { rapport }).pipe(
      tap(maj => this.maintenances.update(list => list.map(m => m.id === id ? maj : m)))
    );
  }

  annuler(id: number): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/${id}/annuler/`, {}).pipe(
      tap(maj => this.maintenances.update(list => list.map(m => m.id === id ? maj : m)))
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/maintenances/${id}/`).pipe(
      tap(() => this.maintenances.update(list => list.filter(m => m.id !== id)))
    );
  }

  signalerPanne(equipementId: number, description: string): Observable<Maintenance> {
    return this.http.post<Maintenance>(`${this.baseUrl}/maintenances/signaler_panne/`, {
      equipement: equipementId, description,
    }).pipe(
      tap(nouvelle => this.maintenances.update(list => [nouvelle, ...list]))
    );
  }
}
