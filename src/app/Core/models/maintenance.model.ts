export type TypeMaintenance = 'PREVENTIVE' | 'CORRECTIVE';
export type StatutMaintenance = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Maintenance {
  id: number;
  equipement: number;
  equipement_nom: string;
  technicien: number | null;
  technicien_nom: string | null;
  type: TypeMaintenance;
  description: string;
  date_planifiee: string;
  date_debut: string | null;
  date_fin: string | null;
  statut: StatutMaintenance;
  rapport: string;
  date_creation: string;
}
