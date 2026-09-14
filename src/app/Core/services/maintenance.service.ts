import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Maintenance } from '../models/maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  maintenances = signal<Maintenance[]>([]);
  loading = signal(false);

  chargerParEquipement(equipementId: number): void {
    this.loading.set(true);
    const params = new HttpParams().set('equipement', equipementId);
    this.http.get<Maintenance[]>(`${this.baseUrl}/maintenances/`, { params }).subscribe({
      next: (data) => { this.maintenances.set(data); this.loading.set(false); },
      error: () => { this.maintenances.set([]); this.loading.set(false); },
    });
  }
}
