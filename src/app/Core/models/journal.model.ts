export interface JournalEntry {
  id: number;
  auteur: number | null;
  auteur_nom: string | null;
  action: string;
  description: string;
  entite_type_nom: string | null;
  entite_id: number | null;
  date_heure: string;
}

export interface JournalPage {
  count: number;
  results: JournalEntry[];
}
