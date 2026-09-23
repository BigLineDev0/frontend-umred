export type UserRole = 'ADMIN' | 'TECHNICIEN' | 'CHERCHEUR' | 'ETUDIANT';

export interface LoginResponse {
  id:number | number;
  access: string;
  refresh: string;
  role: UserRole;
  nom: string;
  prenom: string;
  photo: string | null;
}

export interface CurrentUser {
  id: number;
  nom: string;
  prenom: string;
  role: UserRole;
  photo: string | null;
}

export interface RegisterPayload {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}
