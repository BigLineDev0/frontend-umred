import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import { Utilisateur } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';
import { JournalService } from '../../../../Core/services/journal.service';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { UserStatusModal } from '../../../../Shared/components/user-status-modal/user-status-modal';
import { UtilisateurFormModal } from '../utilisateur-form-modal/utilisateur-form-modal';

@Component({
  standalone: true,
  selector: 'app-utilisateur-detail',
  templateUrl: './utilisateur-detail.html',
  imports: [RouterLink, ButtonModule, DatePipe, StatusBadge, UserStatusModal, UtilisateurFormModal],
})
export class UtilisateurDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private utilisateurService = inject(UtilisateurService);
  readonly journalService = inject(JournalService);

  utilisateur = signal<Utilisateur | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  formModalVisible = signal(false);
  statusModalVisible = signal(false);
  statusLoading = signal(false);

  readonly statusAction = computed(() => this.utilisateur()?.statut_compte === 'INACTIF' ? 'activer' as const : 'desactiver' as const);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.utilisateurService.chargerUn(id).subscribe({
      next: (u) => {
        this.utilisateur.set(u);
        this.loading.set(false);
        this.journalService.chargerParAuteur(id);
      },
      error: () => { this.error.set('Cet utilisateur est introuvable.'); this.loading.set(false); },
    });
  }

  roleLabel(role: string): string {
    return { ADMIN: 'Administrateur', TECHNICIEN: 'Technicien', CHERCHEUR: 'Enseignant-chercheur', ETUDIANT: 'Étudiant' }[role] ?? role;
  }

  ouvrirModification(): void { this.formModalVisible.set(true); }
  ouvrirStatus(): void { this.statusModalVisible.set(true); }

  confirmerStatus(): void {
    const u = this.utilisateur();
    if (!u) return;
    this.statusLoading.set(true);
    const requete = this.statusAction() === 'activer' ? this.utilisateurService.activer(u.id) : this.utilisateurService.desactiver(u.id);
    requete.subscribe({
      next: (maj) => { this.utilisateur.set(maj); this.statusLoading.set(false); this.statusModalVisible.set(false); },
      error: () => this.statusLoading.set(false),
    });
  }

  tempsEcoule(dateIso: string): string {
    const heures = Math.floor((Date.now() - new Date(dateIso).getTime()) / 3600000);
    if (heures < 1) return "À l'instant";
    if (heures < 24) return `Il y a ${heures} heure${heures > 1 ? 's' : ''}`;
    const jours = Math.floor(heures / 24);
    return `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  }
}
