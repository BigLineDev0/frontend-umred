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
  necessite_validation: boolean;
  seuil_heures_maintenance: number;
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
  necessite_validation?: boolean;
  manuel_pdf?: string | null;
  seuil_heures_maintenance?: number;

}

export interface AlerteUsure {
  niveau: 'info' | 'attention' | 'critique' | null;
  message?: string;
  heures_cumulees?: number;
  seuil?: number;
  pannes_recentes?: number;
}

export interface AlerteUsureGlobale {
  equipement_id: number;
  equipement_nom: string;
  laboratoire_nom: string;
  niveau: 'attention' | 'critique';
  message: string;
}
