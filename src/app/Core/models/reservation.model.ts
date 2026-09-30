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
  motif_refus?: string;
  annulable?: boolean;
  demandeur_role?: string;
  projet?: number | null;
  projet_nom?: string | null;
  date_creation: string;
  date_validation: string | null;
  est_archivee: boolean;
}

export interface ReservationPayload {
  laboratoire: number;
  equipements: number[];
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  projet?: number | null;
}

// Créneau proposé par le moteur de planification, classé par proximité
// avec la demande ; 'message' explique la proposition à l'utilisateur.
export interface AlternativeCreneau {
  date: string;
  heure_debut: string;
  heure_fin: string;
  type: 'plus_tard' | 'plus_tot' | 'autre_jour';
  message: string;
}

export interface EquipementEquivalent {
  id: number;
  nom: string;
  remplace: number;
  remplace_nom: string;
}

export interface ConflitCreneau {
  equipement_id: number;
  equipement: string;
  heure_debut: string;
  heure_fin: string;
}

export interface Alternatives {
  creneaux: AlternativeCreneau[];
  equipements_equivalents: EquipementEquivalent[];
}

export interface ReponseConflit {
  conflit: true;
  detail: string;
  conflits: ConflitCreneau[];
  alternatives: Alternatives;
}

// Réponse de /reservations/verifier/, affichée dans le récapitulatif AVANT
// la confirmation : rien n'est encore enregistré.
export interface VerificationReservation {
  disponible: boolean;
  conflits: ConflitCreneau[];
  alternatives?: Alternatives;
  statut_prevu?: StatutReservation;
  raison_statut?: string;
  file_attente?: { nombre: number; rang: number; message: string };
  duree_minutes?: number;
}

export type Recommandation = 'valider' | 'refuser' | 'arbitrer';

// Demande de la file d'attente d'un validateur, avec l'analyse d'aide à la décision.
export interface DemandeEnAttente extends Reservation {
  analyse: {
    priorite_projet: string;
    profil_demandeur: string;
    concurrentes: number;
    rang: number;
    creneau_passe: boolean;
    conflit_avec_reservation_validee: boolean;
    recommandation: Recommandation;
    raison: string;
  };
}

// « Prévenez-moi si ce créneau se libère »
export interface AlerteCreneau {
  id: number;
  laboratoire: number;
  laboratoire_nom: string;
  equipements: number[];
  equipements_noms: string[];
  date: string;
  heure_debut: string;
  heure_fin: string;
  active: boolean;
  date_creation: string;
}

export interface AlerteCreneauPayload {
  laboratoire: number;
  equipements: number[];
  date: string;
  heure_debut: string;
  heure_fin: string;
}
