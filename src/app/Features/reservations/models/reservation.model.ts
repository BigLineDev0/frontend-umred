export type StatutReservation = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' | 'ANNULEE' | 'TERMINEE';

export interface Reservation {
  id: number;

  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
  };

  laboratoire: {
    id: number;
    nom: string;
  };

  equipements: {
    id: number;
    nom: string;
  }[];

  dateDebut: string;
  dateFin: string;
  motif: string;
  statut: StatutReservation;
  dateCreation: string;
  dateValidation?: string;
}

//creer une reservation
export interface CreateReservationRequest {
  laboratoireId: number;
  equipementIds: number[];
  dateDebut: string;
  dateFin: string;
  motif: string;
}
