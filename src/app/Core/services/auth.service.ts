import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { CurrentUser, LoginResponse, RegisterPayload, UserRole } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const ROUTE_PAR_ROLE: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  TECHNICIEN: '/technicien/dashboard',
  CHERCHEUR: '/enseignant/dashboard',
  ETUDIANT: '/etudiant/dashboard',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  private _currentUser = signal<CurrentUser | null>(this.lireUtilisateurStocke());
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => this._currentUser() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login/`, { email, password }).pipe(
      tap(reponse => this.enregistrerSession(reponse))
    );
  }

  register(payload: RegisterPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/register/`, payload).pipe(
      tap(reponse => this.enregistrerSession(reponse))
    );
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    this.http.post(`${environment.apiUrl}/auth/logout/`, { refresh }).subscribe({
      error: () => {}, // best-effort : on déconnecte localement même si l'appel échoue
    });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this._currentUser.set(null);
    this.router.navigate(['/connexion']);
  }

  refreshToken(): Observable<LoginResponse> {
    const refresh = this.getRefreshToken();
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/refresh/`, { refresh }).pipe(
      tap(reponse => {
        localStorage.setItem('access_token', reponse.access);
        if ((reponse as any).refresh) {
          localStorage.setItem('refresh_token', (reponse as any).refresh);
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

  private enregistrerSession(reponse: LoginResponse): void {
    localStorage.setItem('access_token', reponse.access);
    localStorage.setItem('refresh_token', reponse.refresh);
    const user: CurrentUser = {id: reponse.id, nom: reponse.nom, prenom: reponse.prenom, role: reponse.role, photo: reponse.photo };
    localStorage.setItem('current_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private lireUtilisateurStocke(): CurrentUser | null {
    const brut = localStorage.getItem('current_user');
    return brut ? JSON.parse(brut) : null;
  }

  verifierJeton(jeton: string): Observable<{ valide: boolean; prenom?: string }> {
    return this.http.get<{ valide: boolean; prenom?: string }>(`${this.baseUrl}/auth/verifier-jeton/${jeton}/`);
  }

  definirMotDePasse(jeton: string, password: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/auth/definir-mot-de-passe/`, { jeton, password });
  }

  changerMotDePasse(ancien_password: string, nouveau_password: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.baseUrl}/auth/changer-mot-de-passe/`, { ancien_password, nouveau_password });
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
