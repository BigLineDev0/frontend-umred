import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';

import { IndicateursPilotage, NiveauRecommandation, SynthesePilotage } from '../../Core/models/pilotage.model';
import { PilotageService } from '../../Core/services/pilotage.service';
import { LaboratoireService } from '../../Core/services/laboratoire.service';
import { PageHeader } from '../../Shared/components/page-header/page-header';
import { AccordPipe } from '../../Shared/pipes/accord.pipe';
import { couleurTheme } from '../../Shared/utils/couleur-theme';

/**
 * Aide à la décision : la plateforme ne se contente plus d'enregistrer des
 * réservations, elle analyse l'historique pour dire où sont les tensions
 * (équipements saturés, heures de pointe), ce qui dort (sous-utilisation),
 * ce qui arrive (prévision de charge, maintenances dues) et quoi faire.
 */
@Component({
  standalone: true,
  selector: 'app-pilotage',
  templateUrl: './pilotage.html',
  imports: [AccordPipe, DatePipe, FormsModule, ButtonModule, ChartModule, SelectModule, PageHeader],
})
export class Pilotage implements OnInit {
  private pilotageService = inject(PilotageService);
  private laboratoireService = inject(LaboratoireService);

  indicateurs = signal<IndicateursPilotage | null>(null);
  loading = signal(false);
  erreur = signal<string | null>(null);
  jours = signal(30);
  laboratoire = signal<number | null>(null);
  synthese = signal<SynthesePilotage | null>(null);
  syntheseEnCours = signal(false);

  periodeOptions = [
    { label: '7 derniers jours', value: 7 },
    { label: '30 derniers jours', value: 30 },
    { label: '90 derniers jours', value: 90 },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map((l) => ({ label: l.nom, value: l.id })),
  ]);

  readonly styles: Record<NiveauRecommandation, { icone: string; classes: string }> = {
    critique: { icone: 'pi pi-exclamation-circle', classes: 'border-red-200 bg-red-50 text-red-800' },
    attention: { icone: 'pi pi-exclamation-triangle', classes: 'border-amber-200 bg-amber-50 text-amber-800' },
    info: { icone: 'pi pi-lightbulb', classes: 'border-primary/20 bg-primary/5 text-text' },
  };

  // Valeur maximale de la carte de chaleur, pour l'intensité des couleurs.
  readonly maxChaleur = computed(() => {
    const carte = this.indicateurs()?.carte_chaleur;
    return carte ? Math.max(1, ...carte.jours.flatMap((j) => j.valeurs)) : 1;
  });

  readonly graphiquePrevision = computed(() => {
    const ind = this.indicateurs();
    if (!ind) return null;
    const primaire = couleurTheme();
    return {
      labels: ind.prevision_semaine.map((j) => j.jour),
      datasets: [
        { label: 'Attendues (moyenne 4 semaines)', data: ind.prevision_semaine.map((j) => j.attendues),
          backgroundColor: primaire + '55', borderColor: primaire, borderWidth: 1, borderRadius: 4 },
        { label: 'Déjà planifiées', data: ind.prevision_semaine.map((j) => j.deja_planifiees),
          backgroundColor: primaire, borderRadius: 4 },
      ],
    };
  });

  readonly optionsGraphique = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void {
    this.laboratoireService.charger();
    this.charger();
  }

  charger(): void {
    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - (this.jours() - 1));
    this.loading.set(true);
    this.erreur.set(null);
    this.synthese.set(null);
    this.pilotageService.indicateurs({
      dateDebut: this.iso(debut), dateFin: this.iso(fin), laboratoire: this.laboratoire(),
    }).subscribe({
      next: (data) => { this.indicateurs.set(data); this.loading.set(false); },
      error: () => { this.erreur.set("Les indicateurs n'ont pas pu être calculés."); this.loading.set(false); },
    });
  }

  // Le modèle tourne sur CPU : la rédaction prend quelques secondes, elle
  // est donc déclenchée à la demande. En cas d'échec du service IA, la
  // synthèse par règles (fournie par Django) est affichée.
  genererSynthese(): void {
    const ind = this.indicateurs();
    if (!ind) return;
    this.syntheseEnCours.set(true);
    this.pilotageService.synthese(ind.periode.debut, ind.periode.fin).subscribe({
      next: (s) => { this.synthese.set(s); this.syntheseEnCours.set(false); },
      error: () => {
        this.synthese.set({ synthese: ind.synthese_regles, source: 'regles', periode: ind.periode });
        this.syntheseEnCours.set(false);
      },
    });
  }

  intensite(valeur: number): string {
    if (!valeur) return 'transparent';
    const opacite = 0.12 + 0.88 * (valeur / this.maxChaleur());
    return `color-mix(in srgb, var(--color-primary) ${Math.round(opacite * 100)}%, transparent)`;
  }

  largeur(taux: number): string {
    return `${Math.min(100, taux)}%`;
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
