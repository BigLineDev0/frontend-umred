import { Component, computed, inject, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { DotLabel } from '../../../../Shared/components/dot-label';
import { RowActions } from '../../../../Shared/components/row-actions';
import { MaintenanceFormModal } from '../maintenance-form-modal/maintenance-form-modal';
import { MaintenanceClotureModal, MaintenanceACloturer } from '../maintenance-cloture-modal/maintenance-cloture-modal';


interface Maintenance {
  equipement: string;
  type: 'Préventive' | 'Corrective';
  technicien: string;
  datePlanifiee: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  actions?: string;
}

@Component({
  standalone: true,
  selector: 'app-maintenances-list',
  templateUrl: './maintenances-list.html',
  styleUrl: './maintenances-list.css',
  imports: [
    ButtonModule,
    SelectModule,
    PageHeader,
    FilterBar,
    MiniStatCard,
    DataTable,
    ColumnTemplateDirective,
    DotLabel,
    StatusBadge,
    RowActions,
    MaintenanceFormModal,
    MaintenanceClotureModal
],
})
export class MaintenancesList {

  // TODO : remplacer par un appel au MaintenanceService une fois l'API branchée
  maintenances = signal<Maintenance[]>([
    { equipement: 'Spectrophotomètre UV-1800', type: 'Préventive', technicien: 'Mamadou Diop', datePlanifiee: '12 septembre 2026', statut: 'PLANIFIEE' },
    { equipement: 'Microscope électronique',   type: 'Corrective', technicien: 'Awa Ndiaye',   datePlanifiee: '05 septembre 2026', statut: 'TERMINEE' },
    { equipement: 'Centrifugeuse',             type: 'Préventive', technicien: 'Mamadou Diop', datePlanifiee: '20 décembre 2026',  statut: 'PLANIFIEE' },
    { equipement: 'Autoclave',                 type: 'Corrective', technicien: 'Awa Ndiaye',   datePlanifiee: '28 août 2026',      statut: 'EN_COURS' },
    { equipement: 'Bain-marie thermostaté',    type: 'Préventive', technicien: 'Mamadou Diop', datePlanifiee: '15 janvier 2026',   statut: 'ANNULEE' }
  ]);

  columns: TableColumn<Maintenance>[] = [
    { field: 'equipement', header: 'Équipement' },
    { field: 'type', header: 'Type' },
    { field: 'technicien', header: 'Technicien' },
    { field: 'datePlanifiee', header: 'Date planifiée' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '120px' }
  ];

   statutOptions = [
    { label: 'Tous', value: null },
    { label: 'Planifiée', value: 'PLANIFIEE' },
    { label: 'En cours', value: 'EN_COURS' },
    { label: 'Terminée', value: 'TERMINEE' },
    { label: 'Annulée', value: 'ANNULEE' }
  ];

  typeOptions = [
    { label: 'Tous', value: null },
    { label: 'Préventive', value: 'Préventive' },
    { label: 'Corrective', value: 'Corrective' }
  ];

  // État des deux modales
  formModalVisible = signal(false);
  clotureModalVisible = signal(false);
  maintenanceSelectionnee = signal<MaintenanceACloturer | null>(null);

  onSearch(term: string): void {
    // TODO : appeler l'API avec le terme de recherche une fois branchée
    console.log('Recherche :', term);
  }

  onLazyLoad(event: { first: number; rows: number }): void {
    // TODO : appeler GET /maintenances?page=...&size=... ici
    console.log('Page demandée :', event);
  }

  onOuvrirCloture(m: Maintenance): void {
    this.maintenanceSelectionnee.set({
      equipement: m.equipement,
      technicien: m.technicien,
      datePlanifiee: m.datePlanifiee
    });
    this.clotureModalVisible.set(true);
  }

  onVoir(m: Maintenance): void { console.log('voir', m); }
  onModifier(m: Maintenance): void { console.log('modifier', m); }
  onSupprimer(m: Maintenance): void { console.log('supprimer', m); }
}
