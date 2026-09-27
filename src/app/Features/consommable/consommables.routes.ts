import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';


export const CONSOMMABLES_ROUTES: Routes = [
  { path: '', title: 'Consommables', loadComponent: () => import('./pages/consommables-list/consommables-list').then(m => m.ConsommablesList) },
  {
    path: 'ajouter', title: 'Nouveau consommable',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/consommable-form/consommable-form').then(m => m.ConsommableForm)
  },
  { path: ':id', title: 'Détail du consommable',
    loadComponent: () => import('./pages/consommable-detail/consommable-detail').then(m => m.ConsommableDetail)
  },
  {
    path: ':id/modifier', title: 'Modifier le consommable',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/consommable-form/consommable-form').then(m => m.ConsommableForm)
  },
];
