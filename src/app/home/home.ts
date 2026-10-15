import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
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
export class Home implements AfterViewInit {
  private authService = inject(AuthService);
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');

  faqOuverte = signal<number | null>(0);

  toggleFaq(i: number): void { this.faqOuverte.update(c => (c === i ? null : i)); }

  // Lecture automatique sans le son : les navigateurs n'acceptent l'autoplay
  // que pour une vidéo muette, et l'attribut « muted » du gabarit n'est pas
  // appliqué par Angular, d'où le réglage explicite. Les contrôles restent
  // disponibles pour activer le son.
  ngAfterViewInit(): void {
    const el = this.video()?.nativeElement;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => { /* lecture bloquée (économie d'énergie…) : les contrôles restent disponibles */ });
  }

  // Connecté → tableau de bord du rôle ; sinon → page de connexion.
  routeAccueil(): string {
    return this.authService.isAuthenticated() ? this.authService.routeAccueil() : '/connexion';
  }
}
