import { Equipement } from '../models/equipement.model';

export const EQUIPEMENTS_MOCK: Equipement[] = [
  {
    id: 1,
    nom: 'Spectrophotomètre UV-1800',
    reference: 'SP-2024-001',
    laboratoire: {
      id: 1,
      nom: 'Laboratoire de Biochimie'
    },
    statut: 'DISPONIBLE',
    derniereMaintenance: '2026-08-12',
    description: 'Spectrophotomètre pour analyses biochimiques.',
    marque: 'Shimadzu',
    modele: 'UV-1800',
    numeroSerie: 'SH-UV-1800-001',
    dateAcquisition: '2024-02-15',
    dateCreation: '2024-02-15'
  },

  {
    id: 2,
    nom: 'Microscope électronique',
    reference: 'ME-2023-014',
    laboratoire: {
      id: 2,
      nom: 'Laboratoire de Microbiologie'
    },
    statut: 'EN_MAINTENANCE',
    derniereMaintenance: '2026-08-28',
    description: 'Microscope destiné à l’observation de micro-organismes.',
    marque: 'ZEISS',
    modele: 'EVO 10',
    numeroSerie: 'ZS-EVO-014',
    dateAcquisition: '2023-06-10',
    dateCreation: '2023-06-10'
  },

  {
    id: 3,
    nom: 'Centrifugeuse',
    reference: 'CF-2024-003',
    laboratoire: {
      id: 1,
      nom: 'Laboratoire de Biochimie'
    },
    statut: 'DISPONIBLE',
    derniereMaintenance: '2026-07-04',
    description: 'Centrifugeuse pour séparation des échantillons.',
    marque: 'Eppendorf',
    modele: '5430 R',
    numeroSerie: 'EP-5430-003',
    dateAcquisition: '2024-01-20',
    dateCreation: '2024-01-20'
  },

  {
    id: 4,
    nom: 'Autoclave',
    reference: 'AC-2024-007',
    laboratoire: {
      id: 3,
      nom: 'Laboratoire de Biologie Moléculaire'
    },
    statut: 'RESERVE',
    derniereMaintenance: '2026-06-15',
    description: 'Autoclave pour stérilisation du matériel.',
    marque: 'Tuttnauer',
    modele: '3870 EA',
    numeroSerie: 'TT-3870-007',
    dateAcquisition: '2024-04-10',
    dateCreation: '2024-04-10'
  },

  {
    id: 5,
    nom: 'Bain-marie thermostaté',
    reference: 'BM-2023-018',
    laboratoire: {
      id: 2,
      nom: 'Laboratoire de Microbiologie'
    },
    statut: 'EN_PANNE',
    derniereMaintenance: '2026-01-21',
    description: 'Bain-marie thermostaté pour préparation des échantillons.',
    marque: 'Memmert',
    modele: 'WNB',
    numeroSerie: 'MM-WNB-018',
    dateAcquisition: '2023-03-12',
    dateCreation: '2023-03-12'
  },

  {
    id: 6,
    nom: 'Agitateur magnétique',
    reference: 'AG-2023-022',
    laboratoire: {
      id: 4,
      nom: "Laboratoire d'Imagerie"
    },
    statut: 'HORS_SERVICE',
    derniereMaintenance: '2025-03-02',
    description: 'Agitateur magnétique pour préparation des solutions.',
    marque: 'IKA',
    modele: 'RCT Basic',
    numeroSerie: 'IKA-RCT-022',
    dateAcquisition: '2023-02-18',
    dateCreation: '2023-02-18'
  },

  {
    id: 7,
    nom: 'Balance analytique',
    reference: 'BA-2024-012',
    laboratoire: {
      id: 1,
      nom: 'Laboratoire de Biochimie'
    },
    statut: 'DISPONIBLE',
    derniereMaintenance: '2026-08-05',
    description: 'Balance de précision pour analyses scientifiques.',
    marque: 'Sartorius',
    modele: 'Entris II',
    numeroSerie: 'SAR-012',
    dateAcquisition: '2024-05-03',
    dateCreation: '2024-05-03'
  },

  {
    id: 8,
    nom: 'PCR',
    reference: 'PC-2024-007',
    laboratoire: {
      id: 3,
      nom: 'Laboratoire de Biologie Moléculaire'
    },
    statut: 'DISPONIBLE',
    derniereMaintenance: '2026-07-18',
    description: 'Thermocycleur pour amplification de l’ADN.',
    marque: 'Bio-Rad',
    modele: 'T100',
    numeroSerie: 'BR-T100-007',
    dateAcquisition: '2024-07-10',
    dateCreation: '2024-07-10'
  }
];
