import { NiveauPriorite } from '../../Core/models/projet.model';

export const LIBELLES_PRIORITE: Record<NiveauPriorite, string> = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  CRITIQUE: 'Critique',
};

// Classes Tailwind du badge : seules les priorités élevées attirent l'œil.
export const CLASSES_PRIORITE: Record<NiveauPriorite, string> = {
  BASSE: 'bg-background text-text-secondary',
  NORMALE: 'bg-primary/10 text-primary',
  HAUTE: 'bg-accent/15 text-accent',
  CRITIQUE: 'bg-danger/10 text-danger',
};

export function libellePriorite(niveau: string | null | undefined): string {
  return niveau ? LIBELLES_PRIORITE[niveau as NiveauPriorite] ?? niveau : '';
}

export function classesPriorite(niveau: string | null | undefined): string {
  return niveau ? CLASSES_PRIORITE[niveau as NiveauPriorite] ?? CLASSES_PRIORITE.NORMALE : CLASSES_PRIORITE.NORMALE;
}
