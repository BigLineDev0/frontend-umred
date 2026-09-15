import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';


export const UTILISATEURS_ROUTES: Routes = [
  { path: '', canActivate: [roleGuard(['ADMIN'])], loadComponent: () => import('./pages/utilisateurs-list/utilisateurs-list').then(m => m.UtilisateursList) },
  { path: ':id', canActivate: [roleGuard(['ADMIN'])], loadComponent: () => import('./pages/utilisateur-detail/utilisateur-detail').then(m => m.UtilisateurDetail) },
];
