import { Reservation } from '../models/reservation.model';

export const RESERVATIONS_MOCK: Reservation[] = [
  {
    id: 1,
    utilisateur: {
      id: 1,
      nom: 'NDIAYE',
      prenom: 'Aminata',
    },
    laboratoire: {
      id: 1,
      nom: 'Laboratoire de Biochimie',
    },
    equipements: [
      {
        id: 1,
        nom: 'Spectrophotomètre',
      },
    ],
    dateDebut: '2026-09-06T09:00:00',
    dateFin: '2026-09-06T11:00:00',
    motif: 'Analyse biologique',
    statut: 'VALIDEE',
    dateCreation: '2026-09-05T10:00:00',
    dateValidation: '2026-09-05T11:00:00',
  },

  {
    id: 2,
    utilisateur: {
      id: 2,
      nom: 'DIOP',
      prenom: 'Moussa',
    },
    laboratoire: {
      id: 2,
      nom: 'Laboratoire de Microbiologie',
    },
    equipements: [
      {
        id: 2,
        nom: 'Microscope',
      },
    ],
    dateDebut: '2026-09-06T14:00:00',
    dateFin: '2026-09-06T16:00:00',
    motif: 'Recherche microbiologique',
    statut: 'EN_ATTENTE',
    dateCreation: '2026-09-05T14:00:00',
  },

  {
    id: 3,
    utilisateur: {
      id: 3,
      nom: 'FALL',
      prenom: 'Fatou',
    },
    laboratoire: {
      id: 3,
      nom: 'Laboratoire de Biologie Moléculaire',
    },
    equipements: [
      {
        id: 3,
        nom: 'PCR',
      },
      {
        id: 4,
        nom: 'Centrifugeuse',
      },
    ],
    dateDebut: '2026-09-07T10:00:00',
    dateFin: '2026-09-07T12:30:00',
    motif: 'Analyse moléculaire',
    statut: 'VALIDEE',
    dateCreation: '2026-09-06T09:00:00',
    dateValidation: '2026-09-06T10:00:00',
  },

  {
    id: 4,
    utilisateur: {
      id: 4,
      nom: 'SOW',
      prenom: 'Ibrahima',
    },
    laboratoire: {
      id: 4,
      nom: 'Laboratoire de Physique',
    },
    equipements: [
      {
        id: 5,
        nom: 'Oscilloscope',
      },
    ],
    dateDebut: '2026-09-08T08:00:00',
    dateFin: '2026-09-08T10:00:00',
    motif: 'Mesure expérimentale',
    statut: 'REFUSEE',
    dateCreation: '2026-09-07T08:00:00',
  },

  {
    id: 5,
    utilisateur: {
      id: 5,
      nom: 'TOURE',
      prenom: 'Khadija',
    },
    laboratoire: {
      id: 5,
      nom: 'Laboratoire de Chimie Organique',
    },
    equipements: [
      {
        id: 6,
        nom: 'Rotavapor',
      },
    ],
    dateDebut: '2026-09-05T13:00:00',
    dateFin: '2026-09-05T15:00:00',
    motif: 'Extraction chimique',
    statut: 'ANNULEE',
    dateCreation: '2026-09-04T09:00:00',
  },

  {
    id: 6,
    utilisateur: {
      id: 6,
      nom: 'SARR',
      prenom: 'Modou',
    },
    laboratoire: {
      id: 1,
      nom: 'Laboratoire de Biochimie',
    },
    equipements: [
      {
        id: 7,
        nom: 'Centrifugeuse',
      },
    ],
    dateDebut: '2026-09-03T09:30:00',
    dateFin: '2026-09-03T11:00:00',
    motif: 'Préparation des échantillons',
    statut: 'TERMINEE',
    dateCreation: '2026-09-02T10:00:00',
    dateValidation: '2026-09-02T11:00:00',
  },
];
