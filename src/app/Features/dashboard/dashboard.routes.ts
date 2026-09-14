import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  // TECHNICIEN
  {
    path: 'technicien',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-technicien/dashboard-technicien').then(m => m.DashboardTechnicien)
      },
    ]
  },

  // ENSEIGNANT (rôle backend : CHERCHEUR)
  {
    path: 'enseignant',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-chercheur/dashboard-chercheur').then(m => m.DashboardChercheur)
      },
      {
        path: 'reservations',
        loadComponent: () => import('../reservations/pages/mes-reservations/mes-reservations').then(m => m.MesReservations)
      },
    ]
  },

  // ETUDIANT
  {
    path: 'etudiant',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-etudiant/dashboard-etudiant').then(m => m.DashboardEtudiant)
      },
      {
        path: 'mes-demandes',
        loadComponent: () => import('../reservations/pages/mes-reservations/mes-reservations').then(m => m.MesReservations)

      },
    ]
  },

  // ADMIN
  {
    path: 'admin',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin)
      },
      {
        path: 'reservations',
        loadComponent: () => import('../reservations/pages/mes-reservations/mes-reservations').then(m => m.MesReservations)
      },

    ]
  },
];
