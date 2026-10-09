import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';

import { Encadrant, Utilisateur } from '../../../../Core/models/utilisateur.model';
import { UtilisateurService } from '../../../../Core/services/utilisateur.service';
import { AccordPipe } from '../../../../Shared/pipes/accord.pipe';
import { accord } from '../../../../Shared/utils/accord';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

/**
 * Rattache plusieurs étudiants au même encadrant en une opération : on
 * choisit l'encadrant, puis on coche les étudiants (recherche, filtre
 * « sans encadrant », tout sélectionner). Le serveur applique tout ou rien.
 */
@Component({
  selector: 'app-assignation-groupee-modal',
  standalone: true,
  imports: [AccordPipe, FormsModule, DialogModule, SelectModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './assignation-groupee-modal.html',
})
export class AssignationGroupeeModal {
  visible = model(false);
  encadrants = input<Encadrant[]>([]);
  // Ouverture depuis le bandeau « sans encadrant » : filtre activé d'emblée.
  sansEncadrantSeulement = input(false);

  private utilisateurService = inject(UtilisateurService);
  private messageService = inject(MessageService);

  encadrantChoisi = signal<number | null>(null);
  recherche = signal('');
  filtreSansEncadrant = signal(false);
  selection = signal<ReadonlySet<number>>(new Set());
  envoi = signal(false);

  // Étudiants rattachables : tous sauf les comptes désactivés.
  private readonly etudiants = computed(() =>
    this.utilisateurService.utilisateurs()
      .filter(u => u.role === 'ETUDIANT' && u.statut_compte !== 'INACTIF')
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr')));

  readonly etudiantsAffiches = computed(() => {
    const texte = this.recherche().toLowerCase().trim();
    return this.etudiants().filter(e =>
      (!this.filtreSansEncadrant() || !e.encadrant) &&
      (!texte || `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(texte)));
  });

  readonly tousAffichesCoches = computed(() => {
    const affiches = this.etudiantsAffiches();
    return affiches.length > 0 && affiches.every(e => this.selection().has(e.id));
  });

  // Nombre d'étudiants déjà encadrés par la personne choisie (aide à répartir la charge).
  readonly dejaEncadres = computed(() => {
    const id = this.encadrantChoisi();
    return id === null ? 0 : this.etudiants().filter(e => e.encadrant === id).length;
  });

  constructor() {
    // Chaque ouverture repart d'un état vierge.
    effect(() => {
      if (!this.visible()) return;
      this.encadrantChoisi.set(null);
      this.recherche.set('');
      this.filtreSansEncadrant.set(this.sansEncadrantSeulement());
      this.selection.set(new Set());
    });
  }

  basculer(etudiant: Utilisateur): void {
    const selection = new Set(this.selection());
    if (selection.has(etudiant.id)) selection.delete(etudiant.id);
    else selection.add(etudiant.id);
    this.selection.set(selection);
  }

  // Coche (ou décoche) les étudiants affichés, sans toucher aux autres.
  basculerTous(): void {
    const selection = new Set(this.selection());
    const cocher = !this.tousAffichesCoches();
    for (const e of this.etudiantsAffiches()) {
      if (cocher) selection.add(e.id);
      else selection.delete(e.id);
    }
    this.selection.set(selection);
  }

  assigner(): void {
    const encadrant = this.encadrantChoisi();
    if (encadrant === null || this.selection().size === 0) return;
    this.envoi.set(true);
    this.utilisateurService.assignerEncadrantGroupe([...this.selection()], encadrant).subscribe({
      next: ({ modifies, inchanges }) => {
        this.envoi.set(false);
        this.visible.set(false);
        const nom = this.encadrants().find(e => e.id === encadrant)?.nom_complet ?? "l'encadrant";
        this.messageService.add({
          severity: 'success', summary: 'Encadrant assigné',
          detail: `${accord(modifies, 'étudiant rattaché', 'étudiants rattachés')} à ${nom}.`
            + (inchanges ? ` ${inchanges} ${inchanges > 1 ? "l'étaient" : "l'était"} déjà.` : ''),
        });
      },
      error: (err) => {
        this.envoi.set(false);
        this.messageService.add({ severity: 'error', summary: 'Assignation impossible', detail: messageErreur(err, 'Assignation impossible.') });
      },
    });
  }
}
