import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: 'inscription',
    loadComponent: () => import('./register/register').then(m => m.Register)
  },
];
