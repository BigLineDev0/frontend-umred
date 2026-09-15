import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  notifications = signal<Notification[]>([]);
  loading = signal(false);

  nonLuesCount = computed(() => this.notifications().filter(n => !n.lu).length);

  charger(): void {
    this.loading.set(true);
    this.http.get<Notification[]>(`${this.baseUrl}/notifications/`).subscribe({
      next: (data) => { this.notifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  marquerLue(id: number) {
    return this.http.post<Notification>(`${this.baseUrl}/notifications/${id}/marquer_lue/`, {}).pipe(
      tap(maj => this.notifications.update(list => list.map(n => n.id === id ? maj : n)))
    );
  }

  marquerToutesLues() {
    return this.http.post(`${this.baseUrl}/notifications/tout_marquer_lu/`, {}).pipe(
      tap(() => this.notifications.update(list => list.map(n => ({ ...n, lu: true }))))
    );
  }
}
