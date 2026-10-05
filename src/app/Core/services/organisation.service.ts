import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { palette, updatePrimaryPalette } from '@primeuix/themes';
import { environment } from '../../../environments/environment';
import {
  NouvelleOrganisation, Organisation, OrganisationPlateforme, OrganisationPublique, StatistiquesPlateforme,
} from '../models/organisation.model';
import { COULEUR_PRIMAIRE_SENLAB, PALETTE_PRIMAIRE_SENLAB } from '../theme/senlab-palette';

// Valeurs par défaut de l'ancienne charte (encore celles du modèle backend) :
// un établissement qui ne les a jamais modifiées reçoit la charte SenLab.
const COULEURS_PAR_DEFAUT_HERITEES = ['#1848D9'];
const SIDEBARS_PAR_DEFAUT_HERITEES = ['#0F172A', '#0F2158'];
const VARIABLES_PRIMAIRES = [
  '--color-primary', '--color-primary-dark', '--color-primary-light', '--color-primary-soft', '--color-primary-tint',
];


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
    this.appliquerCouleurs(COULEUR_PRIMAIRE_SENLAB, null);
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
   * SenLab, à la fois dans les classes Tailwind (variables CSS --color-*)
   * et dans les composants PrimeNG (palette « primary » recalculée de 50
   * à 950 à partir d'une seule couleur). Sans personnalisation, ou avec
   * les anciennes valeurs par défaut du backend, la charte SenLab s'applique.
   */
  private appliquerCouleurs(primaire: string, secondaire: string | null): void {
    const racine = document.documentElement.style;
    const charte = COULEURS_PAR_DEFAUT_HERITEES.includes(primaire.toUpperCase())
      || primaire.toUpperCase() === COULEUR_PRIMAIRE_SENLAB;

    if (charte) {
      for (const variable of VARIABLES_PRIMAIRES) racine.removeProperty(variable);
      updatePrimaryPalette(PALETTE_PRIMAIRE_SENLAB);
    } else {
      const nuances = palette(primaire) as Record<string, string>;
      racine.setProperty('--color-primary', primaire);
      racine.setProperty('--color-primary-dark', nuances['700'] ?? primaire);
      racine.setProperty('--color-primary-light', nuances['300'] ?? primaire);
      racine.setProperty('--color-primary-soft', nuances['200'] ?? primaire);
      racine.setProperty('--color-primary-tint', nuances['50'] ?? primaire);
      updatePrimaryPalette(nuances);
    }

    if (secondaire && !SIDEBARS_PAR_DEFAUT_HERITEES.includes(secondaire.toUpperCase())) {
      racine.setProperty('--color-sidebar', secondaire);
    } else {
      racine.removeProperty('--color-sidebar');
    }
  }
}
