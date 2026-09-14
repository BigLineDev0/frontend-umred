export type StatutEquipement =
  'DISPONIBLE' | 'RESERVE' | 'EN_MAINTENANCE' | 'EN_PANNE' | 'HORS_SERVICE';

export interface Equipement {
  id: number;
  nom: string;
  reference?: string;

  laboratoire: {
    id: number;
    nom: string;
  };

  statut: StatutEquipement;

  derniereMaintenance: string | null;

  description?: string;
  marque?: string;
  modele?: string;
  numeroSerie?: string;

  dateAcquisition?: string;
  dateCreation: string;
}
