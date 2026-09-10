import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

type ReservationStatus =
  | 'VALIDEE'
  | 'EN_ATTENTE'
  | 'REFUSEE'
  | 'ANNULEE'
  | 'TERMINEE';

interface Reservations {
  id: number;
  utilisateur: string;
  laboratoire: string;
  equipements: string[];
  dateDebut: string;
  dateFin: string;
  date: string;
  horaire: string;
  statut: ReservationStatus;
}
@Component({
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    TagModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    DatePickerModule
  ],
  selector: 'app-reservation',
  styleUrl: './reservation.css',
  templateUrl: './reservation.html',
})
export class Reservation {
  search = '';

  selectedStatus: string | null = null;

  selectedLaboratoire: string | null = null;

  selectedPeriod: Date | null = null;


  statusOptions = [
    { label: 'Tous', value: null },
    { label: 'Validée', value: 'VALIDEE' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Refusée', value: 'REFUSEE' },
    { label: 'Annulée', value: 'ANNULEE' },
    { label: 'Terminée', value: 'TERMINEE' }
  ];


  laboratoireOptions = [
    { label: 'Tous', value: null },
    { label: 'Laboratoire de Biochimie', value: 'Laboratoire de Biochimie' },
    { label: 'Laboratoire de Microbiologie', value: 'Laboratoire de Microbiologie' },
    { label: 'Laboratoire de Biologie Moléculaire', value: 'Laboratoire de Biologie Moléculaire' },
    { label: 'Laboratoire de Physique', value: 'Laboratoire de Physique' },
    { label: 'Laboratoire de Chimie Organique', value: 'Laboratoire de Chimie Organique' }
  ];


  reservations = signal<Reservations[]>([
    {
      id: 1,
      utilisateur: 'Aminata Ndiaye',
      laboratoire: 'Laboratoire de Biochimie',
      equipements: ['Spectrophotomètre'],
      dateDebut: '2026-09-06T09:00:00',
      dateFin: '2026-09-06T11:00:00',
      date: '06 sept. 2026',
      horaire: '09:00 – 11:00',
      statut: 'VALIDEE'
    },
    {
      id: 2,
      utilisateur: 'Moussa Diop',
      laboratoire: 'Laboratoire de Microbiologie',
      equipements: ['Microscope'],
      dateDebut: '2026-09-06T14:00:00',
      dateFin: '2026-09-06T16:00:00',
      date: '06 sept. 2026',
      horaire: '14:00 – 16:00',
      statut: 'EN_ATTENTE'
    },
    {
      id: 3,
      utilisateur: 'Fatou Fall',
      laboratoire: 'Laboratoire de Biologie Moléculaire',
      equipements: ['PCR + Centrifugeuse'],
      dateDebut: '2026-09-07T10:00:00',
      dateFin: '2026-09-07T12:30:00',
      date: '07 sept. 2026',
      horaire: '10:00 – 12:30',
      statut: 'VALIDEE'
    },
    {
      id: 4,
      utilisateur: 'Ibrahima Sow',
      laboratoire: 'Laboratoire de Physique',
      equipements: ['Oscilloscope'],
      dateDebut: '2026-09-08T08:00:00',
      dateFin: '2026-09-08T10:00:00',
      date: '08 sept. 2026',
      horaire: '08:00 – 10:00',
      statut: 'REFUSEE'
    },
    {
      id: 5,
      utilisateur: 'Khadija Touré',
      laboratoire: 'Laboratoire de Chimie Organique',
      equipements: ['Rotavapor'],
      dateDebut: '2026-09-05T13:00:00',
      dateFin: '2026-09-05T15:00:00',
      date: '05 sept. 2026',
      horaire: '13:00 – 15:00',
      statut: 'ANNULEE'
    },
    {
      id: 6,
      utilisateur: 'Modou Sarr',
      laboratoire: 'Laboratoire de Biochimie',
      equipements: ['Centrifugeuse'],
      dateDebut: '2026-09-03T09:30:00',
      dateFin: '2026-09-03T11:00:00',
      date: '03 sept. 2026',
      horaire: '09:30 – 11:00',
      statut: 'TERMINEE'
    }
  ]);


  filteredReservations = computed(() => {

    const search = this.search.toLowerCase().trim();

    return this.reservations().filter(reservation => {

      const matchesSearch =
        !search ||
        reservation.utilisateur.toLowerCase().includes(search) ||
        reservation.laboratoire.toLowerCase().includes(search) ||
        reservation.equipements.some(
          equipement =>
            equipement.toLowerCase().includes(search)
        );

      const matchesStatus =
        !this.selectedStatus ||
        reservation.statut === this.selectedStatus;

      const matchesLaboratoire =
        !this.selectedLaboratoire ||
        reservation.laboratoire === this.selectedLaboratoire;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLaboratoire
      );

    });

  });


  getStatusLabel(status: ReservationStatus): string {

    const labels: Record<ReservationStatus, string> = {
      VALIDEE: 'Validée',
      EN_ATTENTE: 'En attente',
      REFUSEE: 'Refusée',
      ANNULEE: 'Annulée',
      TERMINEE: 'Terminée'
    };

    return labels[status];

  }


  getStatusSeverity(status: ReservationStatus) {

    const severity = {
      VALIDEE: 'success',
      EN_ATTENTE: 'warn',
      REFUSEE: 'danger',
      ANNULEE: 'secondary',
      TERMINEE: 'info'
    } as const;

    return severity[status];

  }


  voirReservation(reservation: Reservations) {

    console.log('Voir réservation :', reservation);

  }


  modifierReservation(reservation: Reservations) {

    console.log('Modifier réservation :', reservation);

  }


  annulerReservation(reservation: Reservations) {

    console.log('Annuler réservation :', reservation);

  }
}
