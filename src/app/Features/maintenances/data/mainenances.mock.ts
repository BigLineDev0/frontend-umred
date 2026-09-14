import { Maintenance } from '../models/maintenance.model';

export const MAINTENANCES_MOCK: Maintenance[] = [
  {
    id: 1,
    equipement: {
      id: 1,
      nom: 'Spectrophotomètre UV-1800'
    },
    type: 'PREVENTIVE',
    technicien: {
      id: 1,
      nom: 'Diop',
      prenom: 'Mamadou'
    },
    datePlanifiee: '2026-09-12T09:00:00',
    statut: 'PLANIFIEE',
    description: 'Maintenance préventive du spectrophotomètre.',
    dateCreation: '2026-09-01T10:00:00'
  },

  {
    id: 2,
    equipement: {
      id: 2,
      nom: 'Microscope électronique'
    },
    type: 'CORRECTIVE',
    technicien: {
      id: 2,
      nom: 'Ndiaye',
      prenom: 'Awa'
    },
    datePlanifiee: '2026-09-05T10:00:00',
    statut: 'TERMINEE',
    description: 'Réparation du système optique.',
    dateDebut: '2026-09-05T10:00:00',
    dateFin: '2026-09-05T13:00:00',
    rapport: 'Intervention terminée avec succès.',
    dateCreation: '2026-08-28T09:00:00'
  },

  {
    id: 3,
    equipement: {
      id: 3,
      nom: 'Centrifugeuse'
    },
    type: 'PREVENTIVE',
    technicien: {
      id: 1,
      nom: 'Diop',
      prenom: 'Mamadou'
    },
    datePlanifiee: '2026-12-20T09:00:00',
    statut: 'PLANIFIEE',
    description: 'Contrôle préventif général.',
    dateCreation: '2026-09-02T08:00:00'
  },

  {
    id: 4,
    equipement: {
      id: 4,
      nom: 'Autoclave'
    },
    type: 'CORRECTIVE',
    technicien: {
      id: 2,
      nom: 'Ndiaye',
      prenom: 'Awa'
    },
    datePlanifiee: '2026-08-28T08:30:00',
    statut: 'EN_COURS',
    description: 'Diagnostic et réparation du système de chauffe.',
    dateDebut: '2026-08-28T08:30:00',
    dateCreation: '2026-08-27T15:00:00'
  },

  {
    id: 5,
    equipement: {
      id: 5,
      nom: 'Bain-marie thermostaté'
    },
    type: 'PREVENTIVE',
    technicien: {
      id: 1,
      nom: 'Diop',
      prenom: 'Mamadou'
    },
    datePlanifiee: '2026-01-15T09:00:00',
    statut: 'ANNULEE',
    description: 'Maintenance annulée.',
    dateCreation: '2026-01-05T09:00:00'
  }
];
