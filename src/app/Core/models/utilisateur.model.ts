export type Role = 'ADMIN' | 'TECHNICIEN' | 'CHERCHEUR' | 'ETUDIANT';
export type StatutCompte = 'EN_ATTENTE' | 'ACTIF' | 'INACTIF';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
  photo: string | null;
  statut_compte: StatutCompte;
  date_creation: string;
  last_login: string | null;
}

export interface UtilisateurPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: Role;
}
