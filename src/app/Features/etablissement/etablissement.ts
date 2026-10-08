import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';

import { OrganisationService } from '../../Core/services/organisation.service';
import { HoraireJour } from '../../Core/models/organisation.model';
import { PageHeader } from '../../Shared/components/page-header/page-header';
import { COULEUR_PRIMAIRE_SENLAB, COULEUR_SIDEBAR_SENLAB } from '../../Core/theme/senlab-palette';
import { messageErreur } from '../../Shared/utils/message-erreur';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/**
 * Personnalisation SaaS : chaque établissement adapte la plateforme à son
 * identité (logo, couleurs) et à son fonctionnement (horaires par jour,
 * durées de réservation), sans intervention technique.
 */
@Component({
  standalone: true,
  selector: 'app-etablissement',
  templateUrl: './etablissement.html',
  imports: [FormsModule, ButtonModule, InputTextModule, InputNumberModule, PageHeader],
})
export class Etablissement implements OnInit {
  readonly organisationService = inject(OrganisationService);
  private messageService = inject(MessageService);

  readonly jours = JOURS;
  enregistrement = signal(false);
  apercuLogo = signal<string | null>(null);
  private fichierLogo: File | null = null;

  form = {
    nom: '', ville: '', email_contact: '',
    couleur_primaire: COULEUR_PRIMAIRE_SENLAB, couleur_secondaire: COULEUR_SIDEBAR_SENLAB,
    duree_min_reservation: 30, duree_max_reservation: 480, delai_max_reservation_jours: 60,
  };

  // Un horaire par jour (lundi → dimanche), édité ligne par ligne.
  horaires: HoraireJour[] = this.horairesParDefaut();

  private horairesParDefaut(): HoraireJour[] {
    return JOURS.map((_, jour) => ({ jour, ferme: false, heure_ouverture: '08:00', heure_fermeture: '19:00' }));
  }

  retablirCharte(): void {
    this.form.couleur_primaire = COULEUR_PRIMAIRE_SENLAB;
    this.form.couleur_secondaire = COULEUR_SIDEBAR_SENLAB;
  }

  constructor() {
    // Le formulaire se remplit dès que l'établissement est chargé.
    effect(() => {
      const org = this.organisationService.courante();
      if (!org) return;
      this.form = {
        nom: org.nom, ville: org.ville, email_contact: org.email_contact,
        couleur_primaire: org.couleur_primaire, couleur_secondaire: org.couleur_secondaire,
        duree_min_reservation: org.duree_min_reservation, duree_max_reservation: org.duree_max_reservation,
        delai_max_reservation_jours: org.delai_max_reservation_jours,
      };
      // On garde l'ordre lundi→dimanche et on complète si des jours manquent.
      const parJour = new Map((org.horaires ?? []).map(h => [h.jour, h]));
      this.horaires = JOURS.map((_, jour) => {
        const h = parJour.get(jour);
        return h
          ? { jour, ferme: h.ferme, heure_ouverture: h.heure_ouverture.slice(0, 5), heure_fermeture: h.heure_fermeture.slice(0, 5) }
          : { jour, ferme: false, heure_ouverture: '08:00', heure_fermeture: '19:00' };
      });
      if (!this.fichierLogo) this.apercuLogo.set(org.logo);
    });
  }

  ngOnInit(): void {
    this.organisationService.charger();
  }

  onLogo(event: Event): void {
    const fichier = (event.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    if (fichier.size > 2 * 1024 * 1024) {
      this.messageService.add({ severity: 'warn', summary: 'Logo trop lourd', detail: 'Le logo ne doit pas dépasser 2 Mo.' });
      return;
    }
    this.fichierLogo = fichier;
    this.apercuLogo.set(URL.createObjectURL(fichier));
  }

  private horairesInvalides(): string | null {
    for (const h of this.horaires) {
      if (!h.ferme && h.heure_fermeture <= h.heure_ouverture) {
        return `${JOURS[h.jour]} : la fermeture doit être après l'ouverture.`;
      }
    }
    return null;
  }

  enregistrer(): void {
    const erreurHoraire = this.horairesInvalides();
    if (erreurHoraire) {
      this.messageService.add({ severity: 'warn', summary: 'Horaires incohérents', detail: erreurHoraire });
      return;
    }

    this.enregistrement.set(true);
    // 1) Configuration + horaires en JSON (les données imbriquées passent
    //    mal en multipart) ; 2) le logo, seulement s'il a changé, à part.
    this.organisationService.mettreAJour({ ...this.form, horaires: this.horaires }).subscribe({
      next: () => this.fichierLogo ? this.envoyerLogo() : this.termine(),
      error: (err) => this.echec(err),
    });
  }

  private envoyerLogo(): void {
    const donnees = new FormData();
    donnees.append('logo', this.fichierLogo!);
    this.organisationService.mettreAJour(donnees).subscribe({
      next: () => { this.fichierLogo = null; this.termine(); },
      error: (err) => this.echec(err),
    });
  }

  private termine(): void {
    this.enregistrement.set(false);
    this.messageService.add({ severity: 'success', summary: 'Établissement mis à jour', detail: 'Les modifications sont appliquées pour tous les utilisateurs.' });
  }

  private echec(err: unknown): void {
    this.enregistrement.set(false);
    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: messageErreur(err, 'Enregistrement impossible.') });
  }
}
