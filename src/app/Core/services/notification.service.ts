import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationPage } from '../models/notification.model';
import { AuthService } from './auth.service';

export interface NotificationFilters {
  type?: string; lu?: boolean; page?: number; pageSize?: number;
}

// Rafraîchissement du compteur de la cloche, uniquement onglet visible.
const INTERVALLE_COMPTEUR_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiUrl;

  // Aperçu léger pour le panneau du topbar — jamais toute la liste.
  recentes = signal<Notification[]>([]);
  unreadCount = signal(0);

  // Liste complète paginée, pour la page dédiée /notifications.
  entrees = signal<Notification[]>([]);
  total = signal(0);
  loading = signal(false);

  constructor() {
    this.rafraichirCompteur();
    // Sondage léger plutôt qu'un flux WebSocket : suffisant pour un
    // laboratoire, sans infrastructure supplémentaire côté backend.
    const minuterie = setInterval(() => {
      if (document.visibilityState === 'visible') this.rafraichirCompteur();
    }, INTERVALLE_COMPTEUR_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }

  rafraichirCompteur(): void {
    if (!this.auth.isAuthenticated()) return;
    this.http.get<{ count: number }>(`${this.baseUrl}/notifications/non_lues_count/`).subscribe({
      next: (res) => this.unreadCount.set(res.count),
      error: () => {},
    });
  }

  chargerRecentes(): void {
    const params = new HttpParams().set('page_size', '5');
    this.http.get<NotificationPage>(`${this.baseUrl}/notifications/`, { params }).subscribe({
      next: (res) => this.recentes.set(res.results),
      error: () => {},
    });
  }

  charger(filters: NotificationFilters = {}): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (filters.type) params = params.set('type', filters.type);
    if (filters.lu !== undefined) params = params.set('lu', String(filters.lu));
    params = params.set('page', String(filters.page ?? 1));
    params = params.set('page_size', String(filters.pageSize ?? 10));

    this.http.get<NotificationPage>(`${this.baseUrl}/notifications/`, { params }).subscribe({
      next: (res) => { this.entrees.set(res.results); this.total.set(res.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  marquerLue(id: number) {
    return this.http.post<Notification>(`${this.baseUrl}/notifications/${id}/marquer_lue/`, {}).pipe(
      tap(maj => {
        this.recentes.update(list => list.map(n => n.id === id ? maj : n));
        this.entrees.update(list => list.map(n => n.id === id ? maj : n));
        this.rafraichirCompteur();
      })
    );
  }

  marquerToutesLues() {
    return this.http.post(`${this.baseUrl}/notifications/tout_marquer_lu/`, {}).pipe(
      tap(() => {
        this.recentes.update(list => list.map(n => ({ ...n, lu: true })));
        this.entrees.update(list => list.map(n => ({ ...n, lu: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
