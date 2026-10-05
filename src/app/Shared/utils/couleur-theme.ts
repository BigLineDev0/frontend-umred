import { COULEUR_PRIMAIRE_SENLAB } from '../../Core/theme/senlab-palette';

/**
 * Couleur courante d'un token de la charte (ex. --color-primary), utile pour
 * Chart.js qui ne comprend pas les variables CSS. Suit la personnalisation
 * de l'établissement, avec le bleu SenLab en repli.
 */
export function couleurTheme(token = '--color-primary'): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || COULEUR_PRIMAIRE_SENLAB;
}
