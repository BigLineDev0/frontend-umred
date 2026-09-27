import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';

export const EQUIPEMENTS_ROUTES: Routes = [
  {
    path: '', title: 'Équipements',
    loadComponent: () => import('./pages/equipements-list/equipements-list').then(m => m.EquipementsList)
  },
  {
    path: 'ajouter', title: 'Nouvel équipement',
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/equipement-form/equipement-form').then(m => m.EquipementForm)
  },
  {
    path: ':id', title: "Détail de l'équipement",
    loadComponent: () => import('./pages/equipement-detail/equipement-detail').then(m => m.EquipementDetail)
  },
  {
    path: ':id/modifier', title: "Modifier l'équipement",
    canActivate: [roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./pages/equipement-form/equipement-form').then(m => m.EquipementForm)
  },
];
