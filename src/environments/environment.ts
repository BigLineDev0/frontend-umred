// Build de production par défaut (ng build), par exemple pour Vercel.
// Le build Docker utilise environment.docker.ts, généré par le Dockerfile.
export const environment = {
  apiUrl: 'https://api.senlab.site/api',
  aiApiUrl: 'https://ia.senlab.site/api',
};
