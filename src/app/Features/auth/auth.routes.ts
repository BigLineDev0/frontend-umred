import { Routes } from '@angular/router';
import { guestGuard } from '../../Core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'connexion',
    title: 'Connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: 'inscription',
    title: 'Inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./register/register').then(m => m.Register)
  },

  {
    path: 'mot-de-passe-oublie',
    title: 'Mot de passe oublié',
    canActivate: [guestGuard],
    loadComponent: () => import('./mot-de-passe-oublie/mot-de-passe-oublie').then(m => m.MotDePasseOublie)
  },

  {
    path: 'activer-compte/:jeton',
    title: 'Activation du compte',
    loadComponent: () => import('./activer-compte/activer-compte').then(m => m.ActiverCompte)
  },

  {
    path: 'definir-mot-de-passe/:jeton',
    title: 'Activer mon compte',
    loadComponent: () => import('./definir-mot-de-passe/definir-mot-de-passe').then(m => m.DefinirMotDePasse)
  },
];
