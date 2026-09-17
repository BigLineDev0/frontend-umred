import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../Core/services/auth.service';
import { RevealDirective } from '../Shared/directives/reveal.directive';
import { ParallaxDirective } from '../Shared/directives/parallax.directive';
import { AnimatedNumber } from '../Shared/components/animated-number/animated-number';
import { AssistantChat } from '../Shared/components/assistant-chat/assistant-chat';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RevealDirective, ParallaxDirective, AnimatedNumber, AssistantChat],
  templateUrl: './home.html',
})
export class Home {
  private authService = inject(AuthService);
  private router = inject(Router);

  mobileMenuOpen = signal(false);
  videoOuverte = signal(false);
  faqOuverte = signal<number | null>(0);

  accederPlateforme(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.redirigerSelonRole();
    } else {
      this.router.navigate(['/connexion']);
    }
  }

  toggleMobileMenu(): void { this.mobileMenuOpen.update(v => !v); }
  closeMobileMenu(): void { this.mobileMenuOpen.set(false); }
  toggleFaq(i: number): void { this.faqOuverte.update(c => (c === i ? null : i)); }

  ouvrirVideo(): void { this.videoOuverte.set(true); }
  fermerVideo(): void { this.videoOuverte.set(false); }
}
