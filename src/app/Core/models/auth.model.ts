export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIEN' | 'CHERCHEUR' | 'ETUDIANT';

export interface LoginResponse {
  id:number | number;
  access: string;
  refresh: string;
  role: UserRole;
  nom: string;
  prenom: string;
  photo: string | null;
  organisation: number | null;
}

export interface CurrentUser {
  id: number;
  nom: string;
  prenom: string;
  role: UserRole;
  photo: string | null;
}

// L'inscription ne connecte pas : le compte doit d'abord être activé
// via le lien envoyé par email.
export interface RegisterResponse {
  detail: string;
  email: string;
}

export interface ActivationResponse {
  detail: string;
  deja_active: boolean;
}

export interface RegisterPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  organisation: number;
}
