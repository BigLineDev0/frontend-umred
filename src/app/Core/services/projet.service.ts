import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Projet, ProjetPayload } from '../models/projet.model';

@Injectable({ providedIn: 'root' })
export class ProjetService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  projets = signal<Projet[]>([]);
  loading = signal(false);

  charger(): void {
    this.loading.set(true);
    this.http.get<Projet[]>(`${this.baseUrl}/projets/`).subscribe({
      next: (data) => { this.projets.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  creer(payload: ProjetPayload): Observable<Projet> {
    return this.http.post<Projet>(`${this.baseUrl}/projets/`, payload).pipe(
      tap(nouveau => this.projets.update(list => [nouveau, ...list]))
    );
  }
}
