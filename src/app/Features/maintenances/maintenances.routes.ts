import { Routes } from '@angular/router';

export const MAINTENANCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/maintenances-list/maintenances-list').then(m => m.MaintenancesList)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/maintenance-detail/maintenance-detail').then(m => m.MaintenanceDetail)
  },
];
