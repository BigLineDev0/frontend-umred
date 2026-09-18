export type StatutEquipement = 'DISPONIBLE' | 'RESERVE' | 'EN_MAINTENANCE' | 'EN_PANNE' | 'HORS_SERVICE';

export interface Equipement {
  id: number;
  laboratoire: number;
  laboratoire_nom: string;
  nom: string;
  description: string;
  marque: string;
  modele: string;
  numero_serie: string;
  date_acquisition: string | null;
  statut: StatutEquipement;
  date_creation: string;
  instructions_utilisation: string;
  consignes_securite: string;
  manuel_pdf: string | null;
}

export interface EquipementPayload {
  laboratoire: number;
  nom: string;
  description?: string;
  marque?: string;
  modele?: string;
  numero_serie: string;
  date_acquisition?: string | null;
  statut: StatutEquipement;
  instructions_utilisation?: string;
  consignes_securite?: string;
  manuel_pdf?: string | null;
}
