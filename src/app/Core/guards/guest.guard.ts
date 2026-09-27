import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Pages réservées aux visiteurs (connexion, inscription) : un utilisateur
// déjà connecté est renvoyé vers son tableau de bord au lieu de revoir le formulaire.
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.parseUrl(authService.routeAccueil()) : true;
};
