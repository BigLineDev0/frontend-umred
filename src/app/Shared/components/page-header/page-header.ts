import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../Core/services/auth.service';

export interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.html'
})
export class PageHeader {
  private authService = inject(AuthService);

  breadcrumbs = input<Breadcrumb[]>([]);
  title = input.required<string>();
  subtitle = input<string>();

  // Dans l'espace connecté, "/" renverrait vers la landing page publique :
  // on redirige plutôt vers le tableau de bord du rôle courant.
  resoudreLien(link: string): string {
    return link === '/' ? this.authService.routeAccueil() : link;
  }
}
