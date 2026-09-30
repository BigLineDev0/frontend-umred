// Établissement client de la plateforme (unité d'isolation du SaaS).
export interface Organisation {
  id: number;
  nom: string;
  slug: string;
  ville: string;
  email_contact: string;
  logo: string | null;
  couleur_primaire: string;
  couleur_secondaire: string;
  heure_ouverture: string;
  heure_fermeture: string;
  duree_min_reservation: number;
  duree_max_reservation: number;
  delai_max_reservation_jours: number;
  est_active: boolean;
  date_creation: string;
}

export interface OrganisationPublique {
  id: number;
  nom: string;
  slug: string;
  ville: string;
  logo: string | null;
  couleur_primaire: string;
}

// Vue du super-admin : indicateurs d'usage de chaque établissement.
export interface OrganisationPlateforme extends Organisation {
  nb_laboratoires: number;
  nb_utilisateurs: number;
  nb_equipements: number;
  nb_reservations_30j: number;
}

export interface NouvelleOrganisation {
  nom: string;
  slug: string;
  ville: string;
  email_contact: string;
  admin_email: string;
  admin_nom: string;
  admin_prenom: string;
}

export interface StatistiquesPlateforme {
  organisations_total: number;
  organisations_actives: number;
  utilisateurs_actifs: number;
  reservations_30j: number;
  evolution: { mois: string; reservations: number; nouveaux_utilisateurs: number }[];
}
