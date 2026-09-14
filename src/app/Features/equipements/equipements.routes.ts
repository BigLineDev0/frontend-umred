import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';

export const EQUIPEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/equipements-list/equipements-list').then(m => m.EquipementsList)
  },
  {
    path: 'ajouter',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/equipement-form/equipement-form').then(m => m.EquipementForm)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/equipement-detail/equipement-detail').then(m => m.EquipementDetail)
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/equipement-form/equipement-form').then(m => m.EquipementForm)
  },
];
