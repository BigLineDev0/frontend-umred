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

export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
