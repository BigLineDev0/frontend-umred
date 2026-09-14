export type StatutLaboratoire = 'DISPONIBLE' | 'INDISPONIBLE';

export interface Laboratoire {
  id: number;
  nom: string;
  description: string;
  localisation: string;
  capacite: number | null;
  statut: StatutLaboratoire;
  photo: string | null;
  responsable: number | null;
  responsable_nom: string | null;
  nombre_equipements: number;
  nombre_equipements_disponibles: number;
  date_creation: string;
}

export interface LaboratoirePayload {
  nom: string;
  description: string;
  localisation: string;
  capacite?: number | null;
  statut?: StatutLaboratoire;
}
