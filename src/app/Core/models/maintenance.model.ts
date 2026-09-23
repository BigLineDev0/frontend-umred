export type TypeMaintenance = 'PREVENTIVE' | 'CORRECTIVE';
export type StatutMaintenance = 'SIGNALEE' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Maintenance {
  id: number;
  equipement: number;
  equipement_nom: string;
  equipement_numero_serie: string;
  equipement_laboratoire_nom: string;
  equipement_statut: string;
  technicien: number | null;
  technicien_nom: string | null;
  signale_par: number | null;
  signale_par_nom: string | null;
  type: TypeMaintenance;
  description: string;
  date_planifiee: string;
  date_debut: string | null;
  date_fin: string | null;
  statut: StatutMaintenance;
  rapport: string;
  date_creation: string;
}

export interface MaintenancePayload {
  equipement: number;
  type: TypeMaintenance;
  description: string;
  date_planifiee: string;
}
