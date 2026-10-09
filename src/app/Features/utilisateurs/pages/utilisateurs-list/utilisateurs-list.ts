import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { AccordPipe } from '../../../../Shared/pipes/accord.pipe';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { UserStatusModal } from '../../../../Shared/components/user-status-modal/user-status-modal';
import { UtilisateurFormModal } from '../utilisateur-form-modal/utilisateur-form-modal';
import { AssignationGroupeeModal } from '../assignation-groupee-modal/assignation-groupee-modal';

import { Encadrant, Utilisateur } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

@Component({
  standalone: true,
  selector: 'app-utilisateurs-list',
  templateUrl: './utilisateurs-list.html',
  imports: [AccordPipe, 
    FormsModule, ButtonModule, SelectModule, TooltipModule, DialogModule,
    PageHeader, MiniStatCard, FilterBar, DataTable, ColumnTemplateDirective, StatusBadge,
    UserStatusModal, UtilisateurFormModal, AssignationGroupeeModal,
  ],
})
export class UtilisateursList implements OnInit {
  private router = inject(Router);
  readonly utilisateurService = inject(UtilisateurService);
  private messageService = inject(MessageService);

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
  // Étudiants actifs sans encadrant : leurs demandes retombent sur les
  // techniciens. Le compteur incite l'admin à les rattacher.
  readonly sansEncadrant = computed(() =>
    this.utilisateurs().filter(u => u.role === 'ETUDIANT' && u.statut_compte === 'ACTIF' && !u.encadrant).length);
  filtreSansEncadrant = signal(false);

  // Assignation rapide d'un encadrant
  encadrants = signal<Encadrant[]>([]);
  etudiantCible = signal<Utilisateur | null>(null);
  encadrantChoisi: number | null = null;
  assignationEnCours = signal(false);

  // Assignation groupée (plusieurs étudiants, un encadrant)
  assignationGroupeeVisible = signal(false);
  assignationSansEncadrant = signal(false);

  ouvrirAssignationGroupee(sansEncadrantSeulement = false): void {
    this.assignationSansEncadrant.set(sansEncadrantSeulement);
    this.assignationGroupeeVisible.set(true);
  }

  readonly statutsAcademiques: Record<string, string> = {
    DOCTORANT: 'Doctorant', MAITRE_DE_CONFERENCES: 'Maître de conférences', PROFESSEUR: 'Professeur',
  };

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
    { field: 'telephone', header: 'Téléphone' },
    { field: 'statut_academique', header: 'Statut académique' },
    { field: 'encadrant_nom', header: 'Encadrant' },
    { field: 'actions', header: 'Actions', width: '130px' },
  ];

  readonly filteredUtilisateurs = computed(() => {
    const search = this.search().toLowerCase().trim();
    const role = this.selectedRole();
    const statut = this.selectedStatut();
    return this.utilisateurs().filter(u =>
      (!search || `${u.prenom} ${u.nom}`.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
      (!role || u.role === role) && (!statut || u.statut_compte === statut) &&
      (!this.filtreSansEncadrant() || (u.role === 'ETUDIANT' && !u.encadrant))
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
    this.utilisateurService.encadrants().subscribe({ next: (liste) => this.encadrants.set(liste) });
  }

  ouvrirAssignation(etudiant: Utilisateur): void {
    this.encadrantChoisi = etudiant.encadrant;
    this.etudiantCible.set(etudiant);
  }

  confirmerAssignation(): void {
    const etudiant = this.etudiantCible();
    if (!etudiant) return;
    this.assignationEnCours.set(true);
    this.utilisateurService.assignerEncadrant(etudiant.id, this.encadrantChoisi).subscribe({
      next: (maj) => {
        this.assignationEnCours.set(false);
        this.etudiantCible.set(null);
        this.messageService.add({
          severity: 'success', summary: 'Encadrant mis à jour',
          detail: maj.encadrant_nom
            ? `${maj.prenom} ${maj.nom} est rattaché(e) à ${maj.encadrant_nom}, qui traitera ses demandes.`
            : `${maj.prenom} ${maj.nom} n'a plus d'encadrant : ses demandes iront aux techniciens.`,
        });
      },
      error: (err) => {
        this.assignationEnCours.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: messageErreur(err, 'Assignation impossible.') });
      },
    });
  }

  roleLabel(role: string): string {
    return { ADMIN: 'Administrateur', TECHNICIEN: 'Technicien', CHERCHEUR: 'Enseignant-chercheur', ETUDIANT: 'Étudiant' }[role] ?? role;
  }

  ouvrirAjout(): void { this.utilisateurAModifier.set(null); this.formModalVisible.set(true); }
  ouvrirModification(u: Utilisateur): void { this.utilisateurAModifier.set(u); this.formModalVisible.set(true); }
  voirUtilisateur(u: Utilisateur): void { this.router.navigate(['/utilisateurs', u.id]); }

  ouvrirStatus(u: Utilisateur): void {
    this.utilisateurStatusCible.set(u);
    // Un compte EN_ATTENTE (email non confirmé) peut être activé manuellement.
    this.statusAction.set(u.statut_compte === 'ACTIF' ? 'desactiver' : 'activer');
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
