import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // state.url contient la page exacte que l'utilisateur essayait
  // d'atteindre — on la garde en paramètre pour y revenir après connexion.
  router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
  return false;
};
