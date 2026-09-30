import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { palette, updatePrimaryPalette } from '@primeuix/themes';
import { environment } from '../../../environments/environment';
import {
  NouvelleOrganisation, Organisation, OrganisationPlateforme, OrganisationPublique, StatistiquesPlateforme,
} from '../models/organisation.model';

const COULEUR_PAR_DEFAUT = '#1848D9';

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/organisations`;

  // Établissement de l'utilisateur connecté : identité visuelle et règles
  // de réservation (durée minimale, horaires) utilisées par les formulaires.
  courante = signal<Organisation | null>(null);

  charger(): void {
    this.http.get<Organisation>(`${this.baseUrl}/courante/`).subscribe({
      next: (organisation) => this.definir(organisation),
      // Super-admin (sans établissement) ou erreur : thème par défaut.
      error: () => this.reinitialiser(),
    });
  }

  mettreAJour(donnees: FormData | Partial<Organisation>): Observable<Organisation> {
    return this.http.patch<Organisation>(`${this.baseUrl}/courante/`, donnees).pipe(
      tap((organisation) => this.definir(organisation)),
    );
  }

  reinitialiser(): void {
    this.courante.set(null);
    this.appliquerCouleurs(COULEUR_PAR_DEFAUT, null);
  }

  // --- Public (inscription) ---

  publiques(): Observable<OrganisationPublique[]> {
    return this.http.get<OrganisationPublique[]>(`${this.baseUrl}/publiques/`);
  }

  // --- Console super-admin ---

  lister(): Observable<OrganisationPlateforme[]> {
    return this.http.get<OrganisationPlateforme[]>(`${this.baseUrl}/`);
  }

  creer(donnees: NouvelleOrganisation): Observable<OrganisationPlateforme> {
    return this.http.post<OrganisationPlateforme>(`${this.baseUrl}/`, donnees);
  }

  suspendre(id: number): Observable<OrganisationPlateforme> {
    return this.http.post<OrganisationPlateforme>(`${this.baseUrl}/${id}/suspendre/`, {});
  }

  reactiver(id: number): Observable<OrganisationPlateforme> {
    return this.http.post<OrganisationPlateforme>(`${this.baseUrl}/${id}/reactiver/`, {});
  }

  statistiques(): Observable<StatistiquesPlateforme> {
    return this.http.get<StatistiquesPlateforme>(`${this.baseUrl}/statistiques/`);
  }

  private definir(organisation: Organisation): void {
    this.courante.set(organisation);
    this.appliquerCouleurs(organisation.couleur_primaire, organisation.couleur_secondaire);
  }

  /**
   * Personnalisation SaaS : la couleur de l'établissement remplace le bleu
   * par défaut, à la fois dans les classes Tailwind (variables CSS
   * --color-*) et dans les composants PrimeNG (palette « primary »
   * recalculée de 50 à 950 à partir d'une seule couleur).
   */
  private appliquerCouleurs(primaire: string, secondaire: string | null): void {
    const racine = document.documentElement.style;
    const nuances = palette(primaire) as Record<string, string>;
    racine.setProperty('--color-primary', primaire);
    racine.setProperty('--color-primary-dark', nuances['700'] ?? primaire);
    if (secondaire) {
      racine.setProperty('--color-sidebar', secondaire);
    } else {
      racine.removeProperty('--color-sidebar');
    }
    updatePrimaryPalette(nuances);
  }
}
