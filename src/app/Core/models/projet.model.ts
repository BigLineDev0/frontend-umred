export type NiveauPriorite = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE';

export interface Projet {
  id: number;
  nom: string;
  description: string;
  responsable: number;
  responsable_nom: string;
  niveau_priorite: NiveauPriorite;
  date_creation: string;
}

export interface ProjetPayload {
  nom: string;
  description?: string;
}
