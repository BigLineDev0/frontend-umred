// Build Docker (production) : le frontend est servi sur senlab.site et
// appelle directement l'API Django et le service IA sur leurs sous-domaines.
export const environment = {
  apiUrl: 'https://api.senlab.site/api',
  aiApiUrl: 'https://ia.senlab.site/api',
};
