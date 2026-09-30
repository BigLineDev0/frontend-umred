export type NiveauRecommandation = 'critique' | 'attention' | 'info';

export interface Recommandation {
  niveau: NiveauRecommandation;
  categorie: string;
  titre: string;
  message: string;
}

export interface OccupationRessource {
  id: number;
  nom: string;
  laboratoire?: string;
  categorie?: string;
  heures: number;
  taux_occupation: number;
}

// Réponse de /pilotage/indicateurs/ : indicateurs et recommandations motivées.
export interface IndicateursPilotage {
  periode: { debut: string; fin: string };
  organisation: string | null;
  volumes: {
    reservations: number;
    validees: number;
    en_attente: number;
    refusees: number;
    annulees: number;
    taux_annulation: number;
    taux_refus: number;
    heures_utilisation: number;
    utilisateurs_actifs: number;
    delai_moyen_validation_h: number | null;
    demandes_en_attente_48h: number;
  };
  occupation_laboratoires: OccupationRessource[];
  occupation_equipements: OccupationRessource[];
  carte_chaleur: { heures: string[]; jours: { jour: string; valeurs: number[] }[] };
  heures_de_pointe: { jour: string; heure: string; reservations: number }[];
  prevision_semaine: { jour: string; date: string; attendues: number; deja_planifiees: number }[];
  alertes_usure: { equipement: string; niveau: string; message: string }[];
  alertes_stock: string[];
  recommandations: Recommandation[];
  synthese_regles: string;
}

// Synthèse rédigée par le service IA ; 'regles' = repli sur les gabarits
// (modèle indisponible, ou chiffre non vérifiable dans sa réponse).
export interface SynthesePilotage {
  synthese: string;
  source: 'modele' | 'regles';
  periode: { debut: string; fin: string };
}
