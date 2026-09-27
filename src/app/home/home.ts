import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeader } from '../Shared/components/site-header/site-header';
import { SiteFooter } from '../Shared/components/site-footer/site-footer';
import { RevealDirective } from '../Shared/directives/reveal.directive';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../Core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SiteHeader, SiteFooter, RevealDirective, ButtonModule],
  templateUrl: './home.html',
})
export class Home {
  private authService = inject(AuthService);

  videoOuverte = signal(false);
  faqOuverte = signal<number | null>(0);

  toggleFaq(i: number): void { this.faqOuverte.update(c => (c === i ? null : i)); }
  ouvrirVideo(): void { this.videoOuverte.set(true); }
  fermerVideo(): void { this.videoOuverte.set(false); }

  // Connecté → tableau de bord du rôle ; sinon → page de connexion.
  routeAccueil(): string {
    return this.authService.isAuthenticated() ? this.authService.routeAccueil() : '/connexion';
  }
}
