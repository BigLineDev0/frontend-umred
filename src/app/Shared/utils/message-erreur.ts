/**
 * Message lisible d'une erreur de l'API Django REST Framework, qui peut
 * prendre trois formes : une liste (["Seule une panne signalée…"], nos
 * ValidationError métier), {"detail": "…"}, ou {"champ": ["…"]}.
 * Lire seulement err.error.detail masquait les deux premières formes
 * derrière un « Une erreur est survenue » sans information.
 */
export function messageErreur(err: unknown, defaut = 'Une erreur est survenue.'): string {
  const reponse = err as { status?: number; error?: unknown } | null;

  // Statut 0 : la requête n'a jamais atteint le serveur (arrêté, réseau coupé, CORS).
  if (reponse?.status === 0) {
    return 'Serveur injoignable : vérifiez votre connexion ou réessayez dans un instant.';
  }

  const corps = reponse?.error;
  // Une page HTML d'erreur (500 de Django en mode debug) n'est pas un message lisible.
  if (typeof corps === 'string') {
    return corps.trim() && !corps.trimStart().startsWith('<') ? corps : defaut;
  }
  if (Array.isArray(corps) && corps.length) return String(corps[0]);
  if (corps && typeof corps === 'object') {
    const objet = corps as Record<string, unknown>;
    if (objet['detail']) return String(objet['detail']);
    const premier = Object.values(objet)[0];
    if (Array.isArray(premier) && premier.length) return String(premier[0]);
    if (typeof premier === 'string') return premier;
  }
  return defaut;
}
