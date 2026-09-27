import { Routes } from '@angular/router';
import { roleGuard } from '../../Core/guards/role.guard';

export const RESERVATIONS_ROUTES: Routes = [
  {
    path: 'ajouter', title: 'Créer une réservation',
    loadComponent: () => import('./pages/reservation-form/reservation-form').then(m => m.ReservationForm)
  },
  {
    path: 'a-valider', title: 'Réservations',
    canActivate: [roleGuard(['TECHNICIEN', 'CHERCHEUR', 'ADMIN'])],
    loadComponent: () => import('./pages/reservations-a-valider/reservations-a-valider').then(m => m.ReservationsAValider)
  },
];
