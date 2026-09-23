import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { MouvementStockModal } from '../../../../Shared/components/mouvement-stock-modal/mouvement-stock-modal';

import { Consommable } from '../../../../Core/models/consommable.model';
import { ConsommableService } from '../../../../Core/services/consommable.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';
import { DatePipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  standalone: true,
  selector: 'app-consommables-list',
  templateUrl: './consommables-list.html',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    SelectModule,
    PageHeader,
    MiniStatCard,
    FilterBar,
    DataTable,
    ColumnTemplateDirective,
    StatusBadge,
    MouvementStockModal,
    DatePipe,
    TooltipModule
  ],
})
export class ConsommablesList implements OnInit {
  readonly consommableService = inject(ConsommableService);
  private laboratoireService = inject(LaboratoireService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly consommables = this.consommableService.consommables;
  readonly loading = this.consommableService.loading;
  readonly error = this.consommableService.error;

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'TECHNICIEN';
  });

  search = signal('');
  selectedStatut = signal<string | null>(null);
  selectedLaboratoire = signal<number | null>(null);

  statutOptions = [
    { label: 'Tous', value: null },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Stock faible', value: 'STOCK_FAIBLE' },
    { label: 'Épuisé', value: 'EPUISE' },
    { label: 'Périmé', value: 'PERIME' },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map(l => ({ label: l.nom, value: l.id })),
  ]);

  columns: TableColumn<Consommable>[] = [
    { field: 'nom', header: 'Consommable' },
    { field: 'laboratoire_nom', header: 'Laboratoire' },
    { field: 'quantite_stock', header: 'Stock' },
    { field: 'date_peremption', header: 'Péremption' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '140px' },
  ];

  readonly filteredConsommables = computed(() => {
    const search = this.search().toLowerCase().trim();
    const statut = this.selectedStatut();
    const laboratoire = this.selectedLaboratoire();
    return this.consommables().filter(c =>
      (!search || c.nom.toLowerCase().includes(search)) &&
      (!statut || c.statut === statut) &&
      (!laboratoire || c.laboratoire === laboratoire)
    );
  });

  readonly totalStockFaible = computed(() => this.consommables().filter(c => c.statut === 'STOCK_FAIBLE' || c.statut === 'EPUISE').length);
  readonly totalPerimes = computed(() => this.consommables().filter(c => c.statut === 'PERIME').length);
  readonly totalPeremptionProche = computed(() => this.consommables().filter(c => c.peremption_proche).length);

  modalVisible = signal(false);
  modalMode = signal<'retirer' | 'reapprovisionner'>('retirer');
  consommableSelectionne = signal<Consommable | null>(null);

  ngOnInit(): void {
    this.consommableService.charger();
    this.laboratoireService.charger();
  }

  ouvrirModale(c: Consommable, mode: 'retirer' | 'reapprovisionner'): void {
    this.consommableSelectionne.set(c);
    this.modalMode.set(mode);
    this.modalVisible.set(true);
  }

  voirDetail(consommable: Consommable): void {
      this.router.navigate(['/consommables', consommable.id]);
    }
}
