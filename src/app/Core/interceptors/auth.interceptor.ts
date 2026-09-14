import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshingEnCours = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const requeteAvecToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requeteAvecToken).pipe(
    catchError((error: HttpErrorResponse) => {
      // On ne tente un refresh que sur 401, et jamais sur les endpoints d'auth eux-mêmes
      // (sinon un refresh échoué relancerait un refresh à l'infini).
      const estEndpointAuth = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

      if (error.status !== 401 || estEndpointAuth) {
        return throwError(() => error);
      }

      if (!refreshingEnCours) {
        refreshingEnCours = true;
        refreshSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(reponse => {
            refreshingEnCours = false;
            refreshSubject.next(reponse.access);
            const requeteRejouee = req.clone({
              setHeaders: { Authorization: `Bearer ${reponse.access}` }
            });
            return next(requeteRejouee);
          }),
          catchError(err => {
            refreshingEnCours = false;
            authService.logout();
            return throwError(() => err);
          })
        );
      }

      // Si un refresh est déjà en cours (plusieurs requêtes simultanées),
      // on attend qu'il se termine plutôt que d'en déclencher un deuxième.
      return refreshSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          const requeteRejouee = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next(requeteRejouee);
        })
      );
    })
  );
};
