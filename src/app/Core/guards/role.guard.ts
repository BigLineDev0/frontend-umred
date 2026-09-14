import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

// Une factory plutôt qu'un guard fixe : on peut le réutiliser pour
// n'importe quelle combinaison de rôles sur n'importe quelle route.
export function roleGuard(rolesAutorises: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const role = authService.currentUser()?.role;

    if (role && rolesAutorises.includes(role)) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };
}
