import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import {
  NouvelleOrganisation, OrganisationPlateforme, StatistiquesPlateforme,
} from '../../Core/models/organisation.model';
import { OrganisationService } from '../../Core/services/organisation.service';
import { PageHeader } from '../../Shared/components/page-header/page-header';
import { AccordPipe } from '../../Shared/pipes/accord.pipe';
import { messageErreur } from '../../Shared/utils/message-erreur';

/**
 * Console de l'éditeur du SaaS : combien d'établissements utilisent la
 * solution, avec quelle intensité, et gestion de leur abonnement.
 * L'éditeur ne voit que des indicateurs agrégés, jamais les données
 * métier (réservations nominatives, etc.) des établissements.
 */
@Component({
  standalone: true,
  selector: 'app-plateforme',
  templateUrl: './plateforme.html',
  providers: [ConfirmationService],
  imports: [AccordPipe, DatePipe, FormsModule, ButtonModule, DialogModule, InputTextModule, ConfirmDialogModule, PageHeader],
})
export class Plateforme implements OnInit {
  private organisationService = inject(OrganisationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  organisations = signal<OrganisationPlateforme[]>([]);
  statistiques = signal<StatistiquesPlateforme | null>(null);
  loading = signal(false);
  creationVisible = signal(false);
  creationEnCours = signal(false);
  nouvelle: NouvelleOrganisation = this.vide();

  // Hauteur relative de chaque mois dans le mini-histogramme (10 % minimum pour rester visible).
  hauteur(reservations: number): number {
    const max = Math.max(1, ...(this.statistiques()?.evolution.map((m) => m.reservations) ?? [1]));
    return 10 + (90 * reservations) / max;
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.organisationService.lister().subscribe({
      next: (liste) => { this.organisations.set(liste); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.organisationService.statistiques().subscribe({ next: (s) => this.statistiques.set(s) });
  }

  ouvrirCreation(): void {
    this.nouvelle = this.vide();
    this.creationVisible.set(true);
  }

  // Le slug (identifiant court) est déduit du nom tant qu'il n'a pas été modifié.
  proposerSlug(): void {
    this.nouvelle.slug = this.nouvelle.nom
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }

  creer(): void {
    const n = this.nouvelle;
    if (!n.nom.trim() || !n.slug.trim() || !n.admin_email.trim() || !n.admin_nom.trim() || !n.admin_prenom.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Formulaire incomplet', detail: "Renseignez l'établissement et son administrateur." });
      return;
    }
    this.creationEnCours.set(true);
    this.organisationService.creer(n).subscribe({
      next: (org) => {
        this.creationEnCours.set(false);
        this.creationVisible.set(false);
        this.messageService.add({
          severity: 'success', summary: 'Établissement créé',
          detail: `Une invitation a été envoyée à ${n.admin_email} pour configurer ${org.nom}.`,
        });
        this.charger();
      },
      error: (err) => {
        this.creationEnCours.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: messageErreur(err, 'Création impossible.') });
      },
    });
  }

  basculer(org: OrganisationPlateforme): void {
    const suspendre = org.est_active;
    this.confirmationService.confirm({
      header: suspendre ? "Suspendre l'établissement" : "Réactiver l'établissement",
      message: suspendre
        ? `Plus aucun utilisateur de « ${org.nom} » ne pourra se connecter. Ses données sont conservées.`
        : `Les utilisateurs de « ${org.nom} » pourront de nouveau se connecter.`,
      acceptLabel: suspendre ? 'Suspendre' : 'Réactiver',
      rejectLabel: 'Annuler',
      acceptButtonProps: { severity: suspendre ? 'danger' : 'success' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const requete = suspendre ? this.organisationService.suspendre(org.id) : this.organisationService.reactiver(org.id);
        requete.subscribe({
          next: (maj) => this.organisations.update((liste) => liste.map((o) => (o.id === maj.id ? maj : o))),
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Action impossible', detail: messageErreur(err) }),
        });
      },
    });
  }

  private vide(): NouvelleOrganisation {
    return { nom: '', slug: '', ville: '', email_contact: '', admin_email: '', admin_nom: '', admin_prenom: '' };
  }
}
