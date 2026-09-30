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
  categorie?: string;
  nombre_utilisations?: number;
}

// Tableau de bord d'un équipement : usage, fiabilité, prévision, santé.
export interface StatistiquesEquipement {
  usage: {
    reservations_total: number;
    reservations_par_statut: Record<string, number>;
    reservations_a_venir: number;
    heures_totales: number;
    heures_periode: number;
    periode_jours: number;
    taux_occupation: number;
    taux_annulation: number;
    utilisateurs_distincts: number;
    top_utilisateurs: { nom: string; reservations: number }[];
    mensuel: { mois: string; reservations: number; heures: number }[];
    heures_de_pointe: { jour: string; heure: string; reservations: number }[];
  };
  fiabilite: {
    maintenances_total: number;
    pannes_total: number;
    pannes_90_jours: number;
    mtbf_jours: number | null;
    mttr_heures: number | null;
    derniere_maintenance: string | null;
    prochaine_maintenance: string | null;
  };
  prevision: {
    heures_depuis_maintenance: number;
    seuil_heures: number;
    usure_pourcentage: number;
    maintenance_estimee: { date: string | null; jours: number | null; message: string } | null;
  };
  sante: { score: number; etat: 'bon' | 'surveiller' | 'critique' };
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
