import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Endpoints pour lesquels un 401 ne doit JAMAIS déclencher de refresh :
// identifiants refusés, refresh lui-même refusé, ou déconnexion d'une
// session déjà expirée (sinon logout -> 401 -> refresh -> logout... en boucle).
const ENDPOINTS_SANS_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout'];

let refreshingEnCours = false;
// null : refresh en cours ; chaîne : nouveau token ; false : refresh échoué.
const refreshSubject = new BehaviorSubject<string | null | false>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const requeteAvecToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requeteAvecToken).pipe(
    catchError((error: HttpErrorResponse) => {
      const sansRefresh = ENDPOINTS_SANS_REFRESH.some(chemin => req.url.includes(chemin));
      if (error.status !== 401 || sansRefresh) {
        return throwError(() => error);
      }

      if (!refreshingEnCours) {
        refreshingEnCours = true;
        refreshSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(reponse => {
            refreshingEnCours = false;
            refreshSubject.next(reponse.access);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${reponse.access}` } }));
          }),
          catchError(() => {
            refreshingEnCours = false;
            // Les requêtes en attente sont libérées (en erreur) au lieu de
            // rester suspendues indéfiniment avec leur indicateur de chargement.
            refreshSubject.next(false);
            authService.logout();
            return throwError(() => error);
          })
        );
      }

      // Un refresh est déjà en cours (plusieurs requêtes simultanées) : on
      // attend son résultat plutôt que d'en déclencher un deuxième.
      return refreshSubject.pipe(
        filter(nouveauToken => nouveauToken !== null),
        take(1),
        switchMap(nouveauToken => nouveauToken
          ? next(req.clone({ setHeaders: { Authorization: `Bearer ${nouveauToken}` } }))
          : throwError(() => error)),
      );
    })
  );
};
