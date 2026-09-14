export type StatutReservation = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' | 'ANNULEE' | 'TERMINEE';

export interface Reservation {
  id: number;
  demandeur: number;
  demandeur_nom: string;
  validateur: number | null;
  laboratoire: number;
  laboratoire_nom: string;
  equipements: number[];
  equipements_noms: string[];
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  statut: StatutReservation;
  date_creation: string;
  date_validation: string | null;
}

export interface ReservationPayload {
  laboratoire: number;
  equipements: number[];
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
}
