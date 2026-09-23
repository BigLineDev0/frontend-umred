import { Routes } from '@angular/router';
import { MainLayout } from './Layout/main-layout/main-layout';
import { Home } from './home/home';
import { authGuard } from './Core/guards/auth.guard';
import { roleGuard } from './Core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: Home },

  {
    path: '',
    loadChildren: () => import('./Features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./Features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'reservations',
        loadChildren: () => import('./Features/reservations/reservations.routes').then(m => m.RESERVATIONS_ROUTES)
      },
      {
        path: 'laboratoires',
        loadChildren: () => import('./Features/laboratoires/laboratoires.routes').then(m => m.LABORATOIRES_ROUTES)
      },
      {
        path: 'equipements',
        loadChildren: () => import('./Features/equipements/equipements.routes').then(m => m.EQUIPEMENTS_ROUTES)
      },
      { path: 'consommables',
        loadChildren: () => import('./Features/consommable/consommables.routes').then(m => m.CONSOMMABLES_ROUTES)
      },
      {
        path: 'maintenances',
        loadChildren: () => import('./Features/maintenances/maintenances.routes').then(m => m.MAINTENANCES_ROUTES)
      },
      {
        path: 'utilisateurs',
        loadChildren: () => import('./Features/utilisateurs/utilisateurs.routes').then(m => m.UTILISATEURS_ROUTES)
      },
      {
        path: 'journal-activite', canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./Features/journal/journal-list/journal-list').then(m => m.JournalList)
      },
      {
        path: 'rapports', canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./Features/rapports/rapports/rapports').then(m => m.Rapports)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./Features/notifications/notifications-list/notifications-list').then(m => m.NotificationsList)
      },
      {
        path: 'profil',
        loadComponent: () => import('./Features/profil/profil/profil').then(m => m.Profil)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
