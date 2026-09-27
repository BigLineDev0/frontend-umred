import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SiteHeader } from '../Shared/components/site-header/site-header';
import { SiteFooter } from '../Shared/components/site-footer/site-footer';
import { AuthService } from '../Core/services/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ButtonModule, SiteHeader, SiteFooter],
  templateUrl: './not-found.html',
})
export class NotFound {
  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  estConnecte = this.authService.isAuthenticated;
  // Affichée pour que l'utilisateur repère une faute de frappe dans l'adresse.
  urlDemandee = this.router.url !== '/' ? this.router.url : '';

  liensUtiles = [
    { label: 'Accueil', icon: 'pi pi-home', route: '/' },
    { label: 'À propos', icon: 'pi pi-info-circle', route: '/a-propos' },
    { label: 'Contact', icon: 'pi pi-envelope', route: '/contact' },
  ];

  routeRetour(): string {
    return this.authService.routeAccueil();
  }

  // Arrivé directement sur l'URL (onglet neuf, lien externe) : pas d'historique
  // interne, on renvoie alors vers l'accueil adapté plutôt que de quitter le site.
  pagePrecedente(): void {
    if (history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this.routeRetour());
    }
  }
}
