import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';


export const CONSOMMABLES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/consommables-list/consommables-list').then(m => m.ConsommablesList) },
  {
    path: 'ajouter',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/consommable-form/consommable-form').then(m => m.ConsommableForm)
  },
  { path: ':id',
    loadComponent: () => import('./pages/consommable-detail/consommable-detail').then(m => m.ConsommableDetail)
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/consommable-form/consommable-form').then(m => m.ConsommableForm)
  },
];
