import { Routes } from '@angular/router';

export const LABORATOIRES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/laboratoires-list/laboratoires-list').then(m => m.LaboratoiresList)
  },
  {
    path: 'ajouter',
    loadComponent: () => import('./pages/laboratoire-form/laboratoire-form').then(m => m.LaboratoireForm)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/laboratoire-detail/laboratoire-detail').then(m => m.LaboratoireDetail)
  },
  {
    path: ':id/modifier',
    loadComponent: () => import('./pages/laboratoire-form/laboratoire-form').then(m => m.LaboratoireForm)
  },
];
