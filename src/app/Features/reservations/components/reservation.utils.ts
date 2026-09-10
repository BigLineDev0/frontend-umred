import { Reservation } from '../models/reservation.model';

export function getEquipements(reservation: Reservation): string {
  return reservation.equipements.map((equipement) => equipement.nom).join(', ');
}

export function getEquipementsMobile(reservation: Reservation): string {
  return reservation.equipements.map((equipement) => equipement.nom).join(' + ');
}

export function getDate(reservation: Reservation): string {
  return new Date(reservation.dateDebut).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getHoraire(reservation: Reservation): string {
  const debut = new Date(reservation.dateDebut).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const fin = new Date(reservation.dateFin).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${debut} – ${fin}`;
}
