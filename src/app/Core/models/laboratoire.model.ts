export type StatutLaboratoire = 'DISPONIBLE' | 'INDISPONIBLE';

// Affichée quand un laboratoire n'a pas (ou plus) de photo.
export const PHOTO_LABORATOIRE_DEFAUT = 'images/laboratoire-defaut.jpg';

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
