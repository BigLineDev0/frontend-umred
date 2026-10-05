import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import {
  ActivationResponse, CurrentUser, LoginResponse, RefreshResponse, RegisterPayload, RegisterResponse, UserRole,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { OrganisationService } from './organisation.service';

const ROUTE_PAR_ROLE: Record<UserRole, string> = {
  SUPER_ADMIN: '/plateforme',
  ADMIN: '/admin/dashboard',
  TECHNICIEN: '/technicien/dashboard',
  CHERCHEUR: '/enseignant/dashboard',
  ETUDIANT: '/etudiant/dashboard',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private organisationService = inject(OrganisationService);
  private baseUrl = environment.apiUrl;

  private _currentUser = signal<CurrentUser | null>(this.lireUtilisateurStocke());
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => this._currentUser() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login/`, { email, password }).pipe(
      tap(reponse => this.enregistrerSession(reponse))
    );
  }

  // Pas de session ouverte : le backend crée un compte bloqué et envoie
  // un email d'activation.
  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register/`, payload);
  }

  // Appelé par la page /activer-compte/:jeton (lien reçu par email).
  activerCompte(jeton: string): Observable<ActivationResponse> {
    return this.http.post<ActivationResponse>(`${this.baseUrl}/auth/activer-compte/`, { jeton });
  }

  renvoyerActivation(email: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/auth/renvoyer-activation/`, { email });
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    // Best-effort : on déconnecte localement même si l'appel échoue. Sans
    // refresh token (session déjà expirée), l'appel est inutile.
    if (refresh) {
      this.http.post(`${this.baseUrl}/auth/logout/`, { refresh }).subscribe({ error: () => {} });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this._currentUser.set(null);
    // L'écran de connexion retrouve le thème par défaut de la plateforme.
    this.organisationService.reinitialiser();
    this.router.navigate(['/connexion']);
  }

  refreshToken(): Observable<RefreshResponse> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('Aucune session à renouveler.'));
    }
    return this.http.post<RefreshResponse>(`${this.baseUrl}/auth/refresh/`, { refresh }).pipe(
      tap(reponse => {
        localStorage.setItem('access_token', reponse.access);
        if (reponse.refresh) {
          localStorage.setItem('refresh_token', reponse.refresh);
        }
      })
    );
  }


  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  redirigerSelonRole(): void {
    const user = this._currentUser();
    if (user) {
      this.router.navigate([ROUTE_PAR_ROLE[user.role]]);
    }
  }

  // Page d'accueil de l'espace connecté (tableau de bord du rôle), ou la
  // landing page publique si personne n'est connecté.
  routeAccueil(): string {
    const user = this._currentUser();
    return user ? ROUTE_PAR_ROLE[user.role] : '/';
  }

  private enregistrerSession(reponse: LoginResponse): void {
    localStorage.setItem('access_token', reponse.access);
    localStorage.setItem('refresh_token', reponse.refresh);
    const user: CurrentUser = {id: reponse.id, nom: reponse.nom, prenom: reponse.prenom, role: reponse.role, photo: reponse.photo };
    localStorage.setItem('current_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private lireUtilisateurStocke(): CurrentUser | null {
    // Donnée locale potentiellement corrompue : on repart déconnecté plutôt
    // que de bloquer le démarrage de l'application.
    try {
      const brut = localStorage.getItem('current_user');
      return brut ? (JSON.parse(brut) as CurrentUser) : null;
    } catch {
      localStorage.removeItem('current_user');
      return null;
    }
  }

  verifierJeton(jeton: string): Observable<{ valide: boolean; prenom?: string }> {
    return this.http.get<{ valide: boolean; prenom?: string }>(`${this.baseUrl}/auth/verifier-jeton/${jeton}/`);
  }

  definirMotDePasse(jeton: string, password: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/auth/definir-mot-de-passe/`, { jeton, password });
  }

  // L'e-mail envoyé pointe vers /definir-mot-de-passe/:jeton (même page que l'invitation).
  demanderReinitialisation(email: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/auth/mot-de-passe-oublie/`, { email });
  }

  // Le backend révoque toutes les sessions après un changement de mot de
  // passe et renvoie une nouvelle paire de tokens pour la session courante.
  changerMotDePasse(ancien_password: string, nouveau_password: string): Observable<{ detail: string; access?: string; refresh?: string }> {
    return this.http.post<{ detail: string; access?: string; refresh?: string }>(
      `${this.baseUrl}/auth/changer-mot-de-passe/`, { ancien_password, nouveau_password }
    ).pipe(
      tap(reponse => {
        if (reponse.access) localStorage.setItem('access_token', reponse.access);
        if (reponse.refresh) localStorage.setItem('refresh_token', reponse.refresh);
      })
    );
  }

  // Le nom/prénom affiché dans la sidebar et le topbar vient du token de
  // connexion, pas d'un rechargement — sans ça, un changement de nom ne
  // se refléterait qu'après une déconnexion/reconnexion.
  mettreAJourProfilLocal(nom: string, prenom: string): void {
    const utilisateur = this.currentUser();
    if (!utilisateur) return;
    const maj = { ...utilisateur, nom, prenom };
    localStorage.setItem('current_user', JSON.stringify(maj));
    this._currentUser.set(maj);
  }

  mettreAJourPhotoLocale(photoUrl: string): void {
    const utilisateur = this.currentUser();
    if (!utilisateur) return;
    const maj = { ...utilisateur, photo: photoUrl };
    localStorage.setItem('current_user', JSON.stringify(maj));
    this._currentUser.set(maj);
  }
}
