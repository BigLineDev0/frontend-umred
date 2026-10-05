// Charte SenLab, partagée entre le preset PrimeNG (app.config) et la
// personnalisation par établissement (OrganisationService).

export const COULEUR_PRIMAIRE_SENLAB = '#1B2CC1';
export const COULEUR_SIDEBAR_SENLAB = '#091540';

// Nuances dessinées à la main plutôt que calculées : le 300 reprend le
// pervenche (#7692FF) et le 950 le navy (#091540) du logo.
export const PALETTE_PRIMAIRE_SENLAB: Record<string, string> = {
  50: '#EEF1FF',
  100: '#DDE3FF',
  200: '#BCC8FF',
  300: '#7692FF',
  400: '#4A5FE0',
  500: '#1B2CC1',
  600: '#1724A6',
  700: '#131D88',
  800: '#0F176B',
  900: '#0C1252',
  950: '#091540',
};

// Gris légèrement bleutés : bordures et fonds des champs PrimeNG
// alignés sur les tokens --color-border / --color-background.
export const PALETTE_SURFACE_SENLAB: Record<string, string> = {
  0: '#FFFFFF',
  50: '#F5F7FD',
  100: '#ECEFF8',
  200: '#E3E7F2',
  300: '#CBD1E3',
  400: '#9AA2BF',
  500: '#5B6385',
  600: '#454D70',
  700: '#333A5C',
  800: '#222947',
  900: '#141A36',
  950: '#091540',
};
