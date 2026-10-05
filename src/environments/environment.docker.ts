// Build Docker : le frontend est servi par Nginx, qui relaie /api vers
// Django et /ia vers le service IA. Des chemins relatifs suffisent donc,
// quel que soit le domaine sur lequel la stack est déployée.
export const environment = {
  apiUrl: '/api',
  aiApiUrl: '/ia/api',
};
