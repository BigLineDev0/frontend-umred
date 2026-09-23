export interface ResultatRecherche {
  equipements: { id: number; nom: string; laboratoire_nom: string }[];
  laboratoires: { id: number; nom: string; localisation: string }[];
}
