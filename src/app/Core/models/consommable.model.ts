export type StatutConsommable = 'DISPONIBLE' | 'STOCK_FAIBLE' | 'EPUISE' | 'PERIME';
export type UniteConsommable = 'ML' | 'L' | 'G' | 'KG' | 'UNITE';
export type TypeMouvement = 'UTILISATION' | 'REAPPROVISIONNEMENT' | 'AJUSTEMENT';

export interface Consommable {
  id: number;
  laboratoire: number;
  laboratoire_nom: string;
  nom: string;
  reference: string;
  unite: UniteConsommable;
  quantite_stock: number;
  seuil_alerte: number;
  date_peremption: string | null;
  statut: StatutConsommable;
  peremption_proche: boolean;
  date_creation: string;
}

export interface ConsommablePayload {
  laboratoire: number;
  nom: string;
  reference?: string;
  unite: UniteConsommable;
  quantite_stock: number;
  seuil_alerte: number;
  date_peremption?: string | null;
}

export interface MouvementStock {
  id: number;
  consommable: number;
  consommable_nom: string;
  type: TypeMouvement;
  quantite: number;
  utilisateur: number | null;
  utilisateur_nom: string | null;
  motif: string;
  date_mouvement: string;
}

export interface AlerteConsommable {
  consommable_id: number;
  nom: string;
  laboratoire_nom: string;
  statut: StatutConsommable;
  peremption_proche: boolean;
  quantite_stock: string;
  unite: string;
}
