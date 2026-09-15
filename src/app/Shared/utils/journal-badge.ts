export interface ActionBadge { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary'; }

// Ordre important : "déconnexion" contient "connexion", "désactivation"
// contient "activation" — les formes composées doivent être testées en
// premier, sinon elles seraient toujours prises pour la forme simple.
const REGLES: { motCle: string; label: string; severity: ActionBadge['severity'] }[] = [
  { motCle: 'désactivation', label: 'Désactivation', severity: 'danger' },
  { motCle: 'activation', label: 'Activation', severity: 'success' },
  { motCle: 'déconnexion', label: 'Déconnexion', severity: 'secondary' },
  { motCle: 'connexion', label: 'Connexion', severity: 'success' },
  { motCle: 'suppression', label: 'Suppression', severity: 'danger' },
  { motCle: 'refus', label: 'Refus', severity: 'danger' },
  { motCle: 'validation', label: 'Validation', severity: 'info' },
  { motCle: 'création', label: 'Création', severity: 'info' },
  { motCle: 'modification', label: 'Modification', severity: 'warn' },
  { motCle: 'clôture', label: 'Clôture', severity: 'success' },
  { motCle: 'annulation', label: 'Annulation', severity: 'secondary' },
  { motCle: 'archivage', label: 'Archivage', severity: 'secondary' },
];

export function badgeAction(action: string): ActionBadge {
  const a = action.toLowerCase();
  for (const regle of REGLES) {
    if (a.includes(regle.motCle)) return { label: regle.label, severity: regle.severity };
  }
  return { label: 'Action', severity: 'secondary' };
}
