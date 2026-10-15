import { StatutReservation } from '../../Core/models/reservation.model';

// Affichage des statuts de RÉSERVATION (et non d'équipement ou de
// maintenance), à un seul endroit : libellé, couleur de la pastille, icône
// et sévérité PrimeNG. La couleur n'est jamais seule : libellé et icône
// l'accompagnent toujours (accessibilité).
export interface AffichageStatut {
  libelle: string;
  severite: 'success' | 'danger' | 'warn' | 'info' | 'secondary';
  pastille: string;
  icone: string;
  // Une réservation annulée ou refusée n'occupe aucun créneau : elle est
  // affichée en retrait, jamais comme une réservation active.
  active: boolean;
}

export const STATUTS_RESERVATION: Record<StatutReservation, AffichageStatut> = {
  EN_ATTENTE: { libelle: 'En attente', severite: 'warn', pastille: 'bg-accent', icone: 'pi pi-clock', active: true },
  VALIDEE: { libelle: 'Validée', severite: 'success', pastille: 'bg-success', icone: 'pi pi-check', active: true },
  TERMINEE: { libelle: 'Terminée', severite: 'info', pastille: 'bg-primary', icone: 'pi pi-flag', active: true },
  REFUSEE: { libelle: 'Refusée', severite: 'danger', pastille: 'bg-danger', icone: 'pi pi-times', active: false },
  ANNULEE: { libelle: 'Annulée', severite: 'secondary', pastille: 'bg-text-secondary', icone: 'pi pi-ban', active: false },
};

export const ORDRE_STATUTS: StatutReservation[] = ['EN_ATTENTE', 'VALIDEE', 'TERMINEE', 'REFUSEE', 'ANNULEE'];

const INCONNU: AffichageStatut = { libelle: '', severite: 'info', pastille: 'bg-primary', icone: 'pi pi-circle', active: true };

export function affichageStatut(statut: string): AffichageStatut {
  return STATUTS_RESERVATION[statut as StatutReservation] ?? { ...INCONNU, libelle: statut };
}

export function libelleStatut(statut: string): string {
  return affichageStatut(statut).libelle;
}

export function severiteStatut(statut: string): AffichageStatut['severite'] {
  return affichageStatut(statut).severite;
}

// Jour courant dans le fuseau de l'établissement (TIME_ZONE de Django) et
// non celui du navigateur : un utilisateur en déplacement voit le même
// « aujourd'hui » que la plateforme.
export const FUSEAU_ETABLISSEMENT = 'Africa/Dakar';

export function aujourdHuiEtablissement(maintenant: Date = new Date()): string {
  // en-CA formate en AAAA-MM-JJ.
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU_ETABLISSEMENT }).format(maintenant);
}
