export type PeriodeCle = 'today' | '7j' | '30j' | '3m' | 'custom';

export function calculerPlage(cle: PeriodeCle, customDebut?: Date | null, customFin?: Date | null): { debut: Date; fin: Date } {
  const fin = new Date();
  const debut = new Date();
  switch (cle) {
    case '7j': debut.setDate(debut.getDate() - 7); break;
    case '30j': debut.setDate(debut.getDate() - 30); break;
    case '3m': debut.setMonth(debut.getMonth() - 3); break;
    case 'custom': return { debut: customDebut ?? debut, fin: customFin ?? fin };
  }
  return { debut, fin };
}

// Date au format AAAA-MM-JJ dans le fuseau LOCAL. toISOString() convertit
// en UTC : hors UTC+0, une date choisie à 00h30 devenait la veille.
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Inverse : new Date('2026-10-01') est interprété en UTC (minuit UTC),
// ce qui peut donner le 30 septembre en heure locale.
export function dateLocale(iso: string): Date {
  const [annee, mois, jour] = iso.slice(0, 10).split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}
