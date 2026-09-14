export type UserRole = 'ADMIN' | 'TECHNICIEN' | 'CHERCHEUR' | 'ETUDIANT';

export interface LoginResponse {
  access: string;
  refresh: string;
  role: UserRole;
  nom: string;
  prenom: string;
}

export interface CurrentUser {
  nom: string;
  prenom: string;
  role: UserRole;
}

export interface RegisterPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}
