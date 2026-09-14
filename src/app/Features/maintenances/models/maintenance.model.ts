export type TypeMaintenance = 'PREVENTIVE' | 'CORRECTIVE';

export type StatutMaintenance = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Maintenance {
  id: number;

  equipement: {
    id: number;
    nom: string;
  };

  type: TypeMaintenance;

  technicien: {
    id: number;
    nom: string;
    prenom: string;
  };

  datePlanifiee: string;

  statut: StatutMaintenance;

  description?: string;

  dateDebut?: string;

  dateFin?: string;

  rapport?: string;

  dateCreation: string;
}
