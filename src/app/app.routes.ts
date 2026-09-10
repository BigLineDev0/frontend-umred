import { Routes } from '@angular/router';
import { MainLayout } from './Layout/main-layout/main-layout';
import { DashboardTechnicien } from './Features/dashboard/dashboard-technicien/dashboard-technicien';
import { Home } from './home/home';
import { DashboardChercheur } from './Features/dashboard/dashboard-chercheur/dashboard-chercheur';
import { DashboardEtudiant } from './Features/dashboard/dashboard-etudiant/dashboard-etudiant';
import { DashboardAdmin } from './Features/dashboard/dashboard-admin/dashboard-admin';
import { Login } from './Features/auth/login/login';
import { Register } from './Features/auth/register/register';
import { MesReservations } from './Features/reservations/pages/mes-reservations/mes-reservations';
import { MesDemandes } from './Features/reservations/pages/mes-demandes/mes-demandes';
import { AdminReservation } from './Features/reservations/pages/admin-reservation/admin-reservation';
import { ReservationForm } from './Features/reservations/pages/reservation-form/reservation-form';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'connexion', component: Login },
  { path: 'inscription', component: Register },

  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'reservations/nouvelle',
        component: ReservationForm,
      },

      {
        path: 'technicien/dashboard',
        component: DashboardTechnicien,
      },

      {
        path: 'chercheur/dashboard',
        component: DashboardChercheur,
      },
      {
        path: 'chercheur/dashboard/reservations',
        component: MesReservations,
      },
      {
        path: 'etudiant/dashboard',
        component: DashboardEtudiant,
      },
      {
        path: 'etudiant/dashboard/mes-demandes',
        component: MesDemandes,
      },
      {
        path: 'admin/dashboard',
        component: DashboardAdmin,
      },
      {
        path: 'admin/dashboard/reservations',
        component: AdminReservation,
      },
    ],
  },

  // fallback: redirige vers l'accueil si la route n'existe pas
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
