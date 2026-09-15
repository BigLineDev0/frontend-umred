import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { DotLabel } from '../../../../Shared/components/dot-label';
import { RowActions } from '../../../../Shared/components/row-actions';
import { MaintenanceFormModal } from '../maintenance-form-modal/maintenance-form-modal';
import { MaintenanceClotureModal } from '../maintenance-cloture-modal/maintenance-cloture-modal';

import { Maintenance } from '../../../../Core/models/maintenance.model';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';

@Component({
  standalone: true,
  selector: 'app-maintenances-list',
  templateUrl: './maintenances-list.html',
  providers: [ConfirmationService],
  imports: [
    DatePipe, RouterLink, ButtonModule, FormsModule, SelectModule, TooltipModule, ConfirmDialogModule,
    PageHeader, FilterBar, MiniStatCard, DataTable, ColumnTemplateDirective,
    DotLabel, StatusBadge, RowActions, MaintenanceFormModal, MaintenanceClotureModal,
  ],
})
export class MaintenancesList implements OnInit {
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  readonly maintenanceService = inject(MaintenanceService);

  readonly maintenances = this.maintenanceService.maintenances;
  readonly loading = this.maintenanceService.loading;
  readonly error = this.maintenanceService.error;

  selectedStatut = signal<string | null>(null);
  selectedType = signal<string | null>(null);

  columns: TableColumn<Maintenance>[] = [
    { field: 'equipement_nom', header: 'Équipement' },
    { field: 'type', header: 'Type' },
    { field: 'technicien_nom', header: 'Technicien' },
    { field: 'date_planifiee', header: 'Date planifiée' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '140px' },
  ];

  statutOptions = [
    { label: 'Tous', value: null }, { label: 'Planifiée', value: 'PLANIFIEE' },
    { label: 'En cours', value: 'EN_COURS' }, { label: 'Terminée', value: 'TERMINEE' }, { label: 'Annulée', value: 'ANNULEE' },
  ];
  typeOptions = [
    { label: 'Tous', value: null }, { label: 'Préventive', value: 'PREVENTIVE' }, { label: 'Corrective', value: 'CORRECTIVE' },
  ];

  readonly filteredMaintenances = computed(() => {
    const statut = this.selectedStatut(), type = this.selectedType();
    return this.maintenances().filter(m => (!statut || m.statut === statut) && (!type || m.type === type));
  });

  readonly totalPlanifiees = computed(() => this.count('PLANIFIEE'));
  readonly totalEnCours = computed(() => this.count('EN_COURS'));
  readonly totalAnnulees = computed(() => this.count('ANNULEE'));
  readonly totalTerminees = computed(() => this.count('TERMINEE'));

  formModalVisible = signal(false);
  clotureModalVisible = signal(false);
  maintenanceSelectionnee = signal<Maintenance | null>(null);

  ngOnInit(): void {
    this.maintenanceService.charger();
  }

  private count(statut: string): number {
    return this.maintenances().filter(m => m.statut === statut).length;
  }

  onOuvrirCloture(m: Maintenance): void {
    this.maintenanceSelectionnee.set(m);
    this.clotureModalVisible.set(true);
  }

  onVoir(m: Maintenance): void {
    this.router.navigate(['/maintenances', m.id]);
  }

  onDemarrer(m: Maintenance): void {
    this.maintenanceService.demarrer(m.id).subscribe();
  }

  onAnnuler(m: Maintenance): void {
    this.confirmationService.confirm({
      message: `Annuler la maintenance sur ${m.equipement_nom} ?`,
      header: "Confirmer l'annulation", icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, annuler', rejectLabel: 'Retour', acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.maintenanceService.annuler(m.id).subscribe(),
    });
  }
}
