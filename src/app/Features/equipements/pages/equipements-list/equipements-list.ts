import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { RowActions } from '../../../../Shared/components/row-actions';
import { StatusBadge } from '../../../../Shared/components/status-badge';

import { Equipement } from '../../../../Core/models/equipement.model';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-equipements-list',
  templateUrl: './equipements-list.html',
  providers: [ConfirmationService],
  imports: [
    ButtonModule, FormsModule, SelectModule, ConfirmDialogModule,
    PageHeader, FilterBar, StatusBadge, DataTable, ColumnTemplateDirective, RowActions, RouterLink,
  ],
})
export class EquipementsList implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  readonly equipementService = inject(EquipementService);
  readonly laboratoireService = inject(LaboratoireService);

  readonly equipements = this.equipementService.equipements;
  readonly loading = this.equipementService.loading;
  readonly error = this.equipementService.error;

  // Cohérent avec EstTechnicienOuAdmin côté API — l'UI ne fait que refléter
  // ce que le backend autorise déjà, pas l'inverse.
  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'TECHNICIEN';
  });

  selectedStatut = signal<string | null>(null);
  selectedLaboratoire = signal<number | null>(null);

  columns: TableColumn<Equipement>[] = [
    { field: 'nom', header: 'Équipement' },
    { field: 'numero_serie', header: 'Référence' },
    { field: 'laboratoire_nom', header: 'Laboratoire' },
    { field: 'statut', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '120px' },
  ];

  statutOptions = [
    { label: 'Tous', value: null },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Réservé', value: 'RESERVE' },
    { label: 'En maintenance', value: 'EN_MAINTENANCE' },
    { label: 'En panne', value: 'EN_PANNE' },
    { label: 'Hors service', value: 'HORS_SERVICE' },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map(l => ({ label: l.nom, value: l.id })),
  ]);

  readonly filteredEquipements = computed(() => {
    const statut = this.selectedStatut();
    const laboratoire = this.selectedLaboratoire();
    return this.equipements().filter(e =>
      (!statut || e.statut === statut) && (!laboratoire || e.laboratoire === laboratoire)
    );
  });

  ngOnInit(): void {
    this.equipementService.charger();
    this.laboratoireService.charger();
  }

  onSearch(term: string): void {
    this.equipementService.charger({ search: term || undefined });
  }

  voirEquipement(equipement: Equipement): void {
    this.router.navigate(['/equipements', equipement.id]);
  }

  modifierEquipement(equipement: Equipement): void {
    this.router.navigate(['/equipements', equipement.id, 'modifier']);
  }

  supprimerEquipement(equipement: Equipement): void {
    this.confirmationService.confirm({
      header: "Supprimer l'équipement",
      message: `Voulez-vous vraiment supprimer « ${equipement.nom} » ? Cette action est irréversible.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.equipementService.supprimer(equipement.id).subscribe({
          next: () => this.messageService.add({
            severity: 'success', summary: 'Équipement supprimé', detail: `« ${equipement.nom} » a été supprimé.`,
          }),
          error: (err) => this.messageService.add({
            severity: 'error', summary: 'Suppression impossible', detail: err.error?.detail ?? 'Une erreur est survenue.',
          }),
        });
      },
    });
  }
}
