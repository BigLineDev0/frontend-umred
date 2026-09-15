import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { UserStatusModal } from '../../../../Shared/components/user-status-modal/user-status-modal';
import { UtilisateurFormModal } from '../utilisateur-form-modal/utilisateur-form-modal';

import { Utilisateur } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';

@Component({
  standalone: true,
  selector: 'app-utilisateurs-list',
  templateUrl: './utilisateurs-list.html',
  imports: [
    FormsModule, ButtonModule, SelectModule, TooltipModule,
    PageHeader, MiniStatCard, FilterBar, DataTable, ColumnTemplateDirective, StatusBadge,
    UserStatusModal, UtilisateurFormModal,
  ],
})
export class UtilisateursList implements OnInit {
  private router = inject(Router);
  readonly utilisateurService = inject(UtilisateurService);

  readonly utilisateurs = this.utilisateurService.utilisateurs;
  readonly loading = this.utilisateurService.loading;
  readonly error = this.utilisateurService.error;

  search = signal('');
  selectedRole = signal<string | null>(null);
  selectedStatut = signal<string | null>(null);

  readonly total = computed(() => this.utilisateurs().length);
  readonly actifs = computed(() => this.utilisateurs().filter(u => u.statut_compte === 'ACTIF').length);
  readonly enAttente = computed(() => this.utilisateurs().filter(u => u.statut_compte === 'EN_ATTENTE').length);
  readonly inactifs = computed(() => this.utilisateurs().filter(u => u.statut_compte === 'INACTIF').length);

  roleOptions = [
    { label: 'Rôle : Tous', value: null },
    { label: 'Administrateur', value: 'ADMIN' },
    { label: 'Technicien', value: 'TECHNICIEN' },
    { label: 'Enseignant-chercheur', value: 'CHERCHEUR' },
    { label: 'Étudiant', value: 'ETUDIANT' },
  ];
  statutOptions = [
    { label: 'Statut : Tous', value: null },
    { label: 'Actif', value: 'ACTIF' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Inactif', value: 'INACTIF' },
  ];

  columns: TableColumn<Utilisateur>[] = [
    { field: 'nom', header: 'Utilisateur' },
    { field: 'email', header: 'Email' },
    { field: 'role', header: 'Rôle' },
    { field: 'telephone', header: 'Téléphone' },
    { field: 'statut_compte', header: 'Statut' },
    { field: 'actions', header: 'Actions', width: '130px' },
  ];

  readonly filteredUtilisateurs = computed(() => {
    const search = this.search().toLowerCase().trim();
    const role = this.selectedRole();
    const statut = this.selectedStatut();
    return this.utilisateurs().filter(u =>
      (!search || `${u.prenom} ${u.nom}`.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
      (!role || u.role === role) && (!statut || u.statut_compte === statut)
    );
  });

  formModalVisible = signal(false);
  utilisateurAModifier = signal<Utilisateur | null>(null);
  statusModalVisible = signal(false);
  utilisateurStatusCible = signal<Utilisateur | null>(null);
  statusAction = signal<'activer' | 'desactiver'>('desactiver');
  statusLoading = signal(false);

  ngOnInit(): void {
    this.utilisateurService.charger();
  }

  roleLabel(role: string): string {
    return { ADMIN: 'Administrateur', TECHNICIEN: 'Technicien', CHERCHEUR: 'Enseignant-chercheur', ETUDIANT: 'Étudiant' }[role] ?? role;
  }

  ouvrirAjout(): void { this.utilisateurAModifier.set(null); this.formModalVisible.set(true); }
  ouvrirModification(u: Utilisateur): void { this.utilisateurAModifier.set(u); this.formModalVisible.set(true); }
  voirUtilisateur(u: Utilisateur): void { this.router.navigate(['/utilisateurs', u.id]); }

  ouvrirStatus(u: Utilisateur): void {
    this.utilisateurStatusCible.set(u);
    this.statusAction.set(u.statut_compte === 'INACTIF' ? 'activer' : 'desactiver');
    this.statusModalVisible.set(true);
  }

  confirmerStatus(): void {
    const u = this.utilisateurStatusCible();
    if (!u) return;
    this.statusLoading.set(true);
    const requete = this.statusAction() === 'activer' ? this.utilisateurService.activer(u.id) : this.utilisateurService.desactiver(u.id);
    requete.subscribe({
      next: () => { this.statusLoading.set(false); this.statusModalVisible.set(false); },
      error: () => this.statusLoading.set(false),
    });
  }
}
