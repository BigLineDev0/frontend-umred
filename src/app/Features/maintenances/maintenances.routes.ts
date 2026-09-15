import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';


export const MAINTENANCES_ROUTES: Routes = [
  { path: '', canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/maintenances-list/maintenances-list').then(m => m.MaintenancesList)
  },

  { path: 'pannes', canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/equipements-en-panne/equipements-en-panne').then(m => m.EquipementsEnPanne)
  },

  { path: ':id', canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/maintenance-detail/maintenance-detail').then(m => m.MaintenanceDetail)
  },
];
