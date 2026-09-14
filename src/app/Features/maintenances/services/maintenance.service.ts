import { Injectable, signal } from '@angular/core';

import { Maintenance } from '../models/maintenance.model';
import { MAINTENANCES_MOCK } from '../data/mainenances.mock';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private maintenancesState = signal<Maintenance[]>(MAINTENANCES_MOCK);

  readonly maintenances = this.maintenancesState.asReadonly();

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  loadMaintenances(): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      this.maintenancesState.set(MAINTENANCES_MOCK);
      this.loading.set(false);
    }, 500);
  }

  getMaintenanceById(id: number): Maintenance | undefined {
    return this.maintenancesState().find((maintenance) => maintenance.id === id);
  }

  cloturerMaintenance(id: number): void {
    this.maintenancesState.update((maintenances) =>
      maintenances.map((maintenance) =>
        maintenance.id === id
          ? {
              ...maintenance,
              statut: 'TERMINEE',
              dateFin: new Date().toISOString(),
            }
          : maintenance,
      ),
    );
  }
}
