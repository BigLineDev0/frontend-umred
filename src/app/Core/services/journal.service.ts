import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JournalEntry, JournalPage } from '../models/journal.model';

export interface JournalFilters {
  search?: string; action?: string; entite?: string; auteur?: number;
  dateDebut?: string; dateFin?: string; page?: number; pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  entrees = signal<JournalEntry[]>([]);
  total = signal(0);
  loading = signal(false);

  charger(filters: JournalFilters = {}): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.entite) params = params.set('entite', filters.entite);
    if (filters.auteur) params = params.set('auteur', filters.auteur);
    if (filters.dateDebut) params = params.set('date_debut', filters.dateDebut);
    if (filters.dateFin) params = params.set('date_fin', filters.dateFin);
    params = params.set('page', filters.page ?? 1);
    params = params.set('page_size', filters.pageSize ?? 9);

    this.http.get<JournalPage>(`${this.baseUrl}/logs/`, { params }).subscribe({
      next: (res) => { this.entrees.set(res.results); this.total.set(res.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  chargerParAuteur(auteurId: number): void {
    this.charger({ auteur: auteurId, pageSize: 20 });
  }

  // Bypass la pagination standard — sert au comptage d'utilisateurs actifs
  // sur la page Rapports, où il faut TOUTES les entrées de la période.
  chargerPourAgregation(filters: JournalFilters): Observable<JournalEntry[]> {
    let params = new HttpParams().set('page_size', '1000');
    if (filters.action) params = params.set('action', filters.action);
    if (filters.dateDebut) params = params.set('date_debut', filters.dateDebut);
    if (filters.dateFin) params = params.set('date_fin', filters.dateFin);
    return this.http.get<JournalPage>(`${this.baseUrl}/logs/`, { params }).pipe(map(res => res.results));
  }
}
