/**
 * Accorde un mot avec un nombre : accord(2, 'panne') -> « 2 pannes ».
 * 0 et 1 restent au singulier (usage français). Pluriel irrégulier ou
 * groupe de mots : le passer explicitement (« étudiants encadrés »).
 */
export function accord(nombre: number, singulier: string, pluriel?: string): string {
  return `${nombre} ${nombre <= 1 ? singulier : (pluriel ?? `${singulier}s`)}`;
}
