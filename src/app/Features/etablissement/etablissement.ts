import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';

import { OrganisationService } from '../../Core/services/organisation.service';
import { PageHeader } from '../../Shared/components/page-header/page-header';
import { COULEUR_PRIMAIRE_SENLAB, COULEUR_SIDEBAR_SENLAB } from '../../Core/theme/senlab-palette';
import { messageErreur } from '../../Shared/utils/message-erreur';

/**
 * Personnalisation SaaS : chaque établissement adapte la plateforme à son
 * identité (logo, couleurs) et à son fonctionnement (horaires, durées de
 * réservation), sans intervention technique.
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

  enregistrement = signal(false);
  apercuLogo = signal<string | null>(null);
  private fichierLogo: File | null = null;

  form = {
    nom: '', ville: '', email_contact: '',
    couleur_primaire: COULEUR_PRIMAIRE_SENLAB, couleur_secondaire: COULEUR_SIDEBAR_SENLAB,
    heure_ouverture: '08:00', heure_fermeture: '19:00',
    duree_min_reservation: 30, duree_max_reservation: 480, delai_max_reservation_jours: 60,
  };

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
        heure_ouverture: org.heure_ouverture.slice(0, 5), heure_fermeture: org.heure_fermeture.slice(0, 5),
        duree_min_reservation: org.duree_min_reservation, duree_max_reservation: org.duree_max_reservation,
        delai_max_reservation_jours: org.delai_max_reservation_jours,
      };
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

  enregistrer(): void {
    if (this.form.heure_fermeture <= this.form.heure_ouverture) {
      this.messageService.add({ severity: 'warn', summary: 'Horaires incohérents', detail: "La fermeture doit être après l'ouverture." });
      return;
    }
    // FormData : nécessaire pour envoyer le fichier du logo avec le reste.
    const donnees = new FormData();
    Object.entries(this.form).forEach(([cle, valeur]) => donnees.append(cle, String(valeur ?? '')));
    if (this.fichierLogo) donnees.append('logo', this.fichierLogo);

    this.enregistrement.set(true);
    this.organisationService.mettreAJour(donnees).subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.fichierLogo = null;
        this.messageService.add({ severity: 'success', summary: 'Établissement mis à jour', detail: 'Les modifications sont appliquées pour tous les utilisateurs.' });
      },
      error: (err) => {
        this.enregistrement.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: messageErreur(err, 'Enregistrement impossible.') });
      },
    });
  }
}
