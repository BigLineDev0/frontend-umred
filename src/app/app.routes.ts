import { Routes } from '@angular/router';
import { MainLayout } from './Layout/main-layout/main-layout';
import { Home } from './home/home';
import { authGuard } from './Core/guards/auth.guard';

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
      {
        path: 'maintenances',
        loadChildren: () => import('./Features/maintenances/maintenances.routes').then(m => m.MAINTENANCES_ROUTES)
      },
    ]
  },

  { path: '**', redirectTo: '' }
];
