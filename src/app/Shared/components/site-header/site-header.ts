import { Component, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../Core/services/auth.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './site-header.html',
})
export class SiteHeader {
  private authService = inject(AuthService);

  mobileMenuOpen = signal(false);
  estConnecte = this.authService.isAuthenticated;

  // Chemin ET fragment exacts : "Accueil" (/) et "Fonctionnalités" (/#fonctionnalites)
  // pointent vers la même page, seul le fragment permet de les départager.
  readonly optionsExactes: IsActiveMatchOptions = {
    paths: 'exact', fragment: 'exact', queryParams: 'ignored', matrixParams: 'ignored',
  };

  // Desktop : texte bleu + soulignement qui se déploie depuis le centre.
  readonly lienDesktop = 'relative py-1 transition-colors hover:text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:duration-200';
  readonly lienActif = 'text-primary after:scale-x-100';

  // Mobile : pastille de fond + barre à gauche, plus lisible dans une liste verticale.
  readonly lienMobile = 'block rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-text transition-colors';
  readonly lienActifMobile = '!border-primary bg-primary/5 font-semibold !text-primary';

  routeAccueil(): string { return this.authService.routeAccueil(); }

  toggleMobileMenu(): void { this.mobileMenuOpen.update(v => !v); }
  closeMobileMenu(): void { this.mobileMenuOpen.set(false); }
}
