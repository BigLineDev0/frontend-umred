import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';

export const LABORATOIRES_ROUTES: Routes = [
  {
    path: '', title: 'Laboratoires',
    loadComponent: () => import('./pages/laboratoires-list/laboratoires-list').then(m => m.LaboratoiresList)
  },
  {
    path: 'ajouter', title: 'Nouveau laboratoire',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/laboratoire-form/laboratoire-form').then(m => m.LaboratoireForm)
  },
  {
    path: ':id', title: 'Détail du laboratoire',
    loadComponent: () => import('./pages/laboratoire-detail/laboratoire-detail').then(m => m.LaboratoireDetail)
  },
  {
    path: ':id/modifier', title: 'Modifier le laboratoire',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./pages/laboratoire-form/laboratoire-form').then(m => m.LaboratoireForm)
  },
];
