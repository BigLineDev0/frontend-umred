import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Reservation, StatutReservation } from '../../../Core/models/reservation.model';
import { accord } from '../../utils/accord';
import { ORDRE_STATUTS, STATUTS_RESERVATION, affichageStatut, aujourdHuiEtablissement } from '../../utils/statut-reservation';

// Une entrée du calendrier : une réservation de l'utilisateur, ou une
// demande qu'il doit traiter (chercheur : demandes de ses étudiants).
export interface EvenementCalendrier {
  reservation: Reservation;
  aTraiter: boolean;
}

interface CalendarDay {
  key: string;
  jour: number;
  dansLeMoisCourant: boolean;
  estAujourdhui: boolean;
  evenements: EvenementCalendrier[];
}

type Vue = 'mois' | 'agenda';

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const PASTILLES_MAX = 3;

@Component({
  selector: 'app-reservations-calendar',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './reservations-calendar.html',
})
export class ReservationsCalendar {
  private readonly hote: ElementRef<HTMLElement> = inject(ElementRef);

  // Composant de présentation : la page parente charge les données (une
  // seule requête pour toutes les réservations de l'utilisateur ; changer
  // de mois ne déclenche donc aucun appel réseau).
  reservations = input<Reservation[]>([]);
  // Chercheur : demandes de ses étudiants en attente de sa décision.
  aTraiter = input<Reservation[]>([]);
  chargement = input(false);
  erreur = input<string | null>(null);

  reessayer = output<void>();
  ouvrir = output<Reservation>();

  readonly joursSemaine = JOURS_SEMAINE;
  readonly statuts = ORDRE_STATUTS.map(cle => ({ cle, ...STATUTS_RESERVATION[cle] }));

  private readonly aujourdHuiCle = aujourdHuiEtablissement();
  private moisAffiche = signal(this.debutDuMois(this.depuisCle(this.aujourdHuiCle)));
  selectedDate = signal<string>(this.aujourdHuiCle);
  // Sur petit écran, la liste (agenda) est plus lisible qu'une grille dense.
  vue = signal<Vue>(this.ecranEtroit() ? 'agenda' : 'mois');
  // Filtres : statuts masqués (la légende sert de filtre) et équipement.
  statutsMasques = signal<ReadonlySet<StatutReservation>>(new Set());
  equipementFiltre = signal<string>('');

  readonly libelleMois = computed(() => {
    const d = this.moisAffiche();
    return `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  });

  private readonly tousLesEvenements = computed<EvenementCalendrier[]>(() => [
    ...this.reservations().map(reservation => ({ reservation, aTraiter: false })),
    ...this.aTraiter().map(reservation => ({ reservation, aTraiter: true })),
  ]);

  readonly equipementsDisponibles = computed(() => {
    const noms = new Set<string>();
    for (const { reservation } of this.tousLesEvenements()) reservation.equipements_noms?.forEach(n => noms.add(n));
    return [...noms].sort((a, b) => a.localeCompare(b, 'fr'));
  });

  private readonly evenementsFiltres = computed(() => {
    const masques = this.statutsMasques();
    const equipement = this.equipementFiltre();
    return this.tousLesEvenements().filter(({ reservation: r }) =>
      !masques.has(r.statut) && (!equipement || (r.equipements_noms ?? []).includes(equipement)));
  });

  private readonly parJour = computed(() => {
    const map = new Map<string, EvenementCalendrier[]>();
    for (const e of this.evenementsFiltres()) {
      const liste = map.get(e.reservation.date) ?? [];
      liste.push(e);
      map.set(e.reservation.date, liste);
    }
    // Tri sur des copies : un computed ne doit pas modifier ses sources.
    for (const [cle, liste] of map) map.set(cle, [...liste].sort(comparer));
    return map;
  });

  readonly jours = computed<CalendarDay[]>(() => {
    const mois = this.moisAffiche();
    const premierJourMois = new Date(mois.getFullYear(), mois.getMonth(), 1);
    const decalage = (premierJourMois.getDay() + 6) % 7; // grille commence le lundi
    const debutGrille = new Date(premierJourMois);
    debutGrille.setDate(debutGrille.getDate() - decalage);

    const parJour = this.parJour();
    const jours: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(debutGrille);
      date.setDate(date.getDate() + i);
      const key = this.formatKey(date);
      jours.push({
        key,
        jour: date.getDate(),
        dansLeMoisCourant: date.getMonth() === mois.getMonth(),
        estAujourdhui: key === this.aujourdHuiCle,
        evenements: parJour.get(key) ?? [],
      });
    }
    return jours;
  });

  // Lignes de la grille (une par semaine), pour la structure ARIA.
  readonly semaines = computed(() => {
    const jours = this.jours();
    return Array.from({ length: jours.length / 7 }, (_, i) => jours.slice(i * 7, i * 7 + 7));
  });

  // Case atteignable par Tab : le jour sélectionné s'il est affiché, sinon
  // le 1er du mois affiché (après « mois suivant », la grille reste
  // accessible au clavier).
  readonly cleFocalisable = computed(() => {
    const jours = this.jours();
    const choisi = this.selectedDate();
    return jours.some(j => j.key === choisi) ? choisi : jours.find(j => j.dansLeMoisCourant)!.key;
  });

  readonly evenementsDuJourSelectionne = computed(() => this.parJour().get(this.selectedDate()) ?? []);

  // Vue agenda : les jours du mois affiché qui ont au moins une entrée.
  readonly agendaDuMois = computed(() => {
    const prefixe = this.formatKey(this.moisAffiche()).slice(0, 7);
    return [...this.parJour().entries()]
      .filter(([cle]) => cle.startsWith(prefixe))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cle, evenements]) => ({ cle, libelle: this.libelleJour(cle), evenements }));
  });

  readonly resumeDuMois = computed(() => {
    const total = this.agendaDuMois().reduce((n, j) => n + j.evenements.length, 0);
    return total ? `${accord(total, 'réservation')} en ${this.libelleMois().toLowerCase()}` : `Aucune réservation en ${this.libelleMois().toLowerCase()}`;
  });

  readonly dateSelectionneeLabel = computed(() => this.libelleJour(this.selectedDate()));
  readonly filtreActif = computed(() => this.statutsMasques().size > 0 || !!this.equipementFiltre());

  // --- Navigation ---

  moisPrecedent(): void { this.decalerMois(-1); }
  moisSuivant(): void { this.decalerMois(1); }

  aujourdHui(): void {
    this.moisAffiche.set(this.debutDuMois(this.depuisCle(this.aujourdHuiCle)));
    this.selectedDate.set(this.aujourdHuiCle);
  }

  selectionnerJour(jour: CalendarDay): void {
    this.selectedDate.set(jour.key);
    // Un jour grisé du mois voisin : on affiche ce mois-là.
    if (!jour.dansLeMoisCourant) this.moisAffiche.set(this.debutDuMois(this.depuisCle(jour.key)));
  }

  changerVue(vue: Vue): void { this.vue.set(vue); }

  // Grille au clavier (motif « grille de dates » WAI-ARIA) : flèches pour
  // changer de jour ou de semaine, Début/Fin pour la semaine, Page
  // précédente/suivante pour le mois. Un seul jour est atteignable par Tab.
  surTouche(evenement: KeyboardEvent): void {
    const decalages: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    // Depuis la case qui a le focus (le jour choisi peut être hors de la grille affichée).
    const courant = this.depuisCle(this.cleFocalisable());
    let cible: Date | null = null;
    if (evenement.key in decalages) {
      cible = new Date(courant);
      cible.setDate(cible.getDate() + decalages[evenement.key]);
    } else if (evenement.key === 'Home' || evenement.key === 'End') {
      const rang = (courant.getDay() + 6) % 7;
      cible = new Date(courant);
      cible.setDate(cible.getDate() + (evenement.key === 'Home' ? -rang : 6 - rang));
    } else if (evenement.key === 'PageUp' || evenement.key === 'PageDown') {
      cible = new Date(courant.getFullYear(), courant.getMonth() + (evenement.key === 'PageUp' ? -1 : 1), 1);
      const dernierJour = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
      cible.setDate(Math.min(courant.getDate(), dernierJour));
    }
    if (!cible) return;
    evenement.preventDefault();
    const cle = this.formatKey(cible);
    this.selectedDate.set(cle);
    this.moisAffiche.set(this.debutDuMois(cible));
    // Le bouton du nouveau jour n'existe qu'après le rendu.
    setTimeout(() => this.hote.nativeElement.querySelector<HTMLButtonElement>(`[data-cle="${cle}"]`)?.focus());
  }

  // --- Filtres ---

  basculerStatut(statut: StatutReservation): void {
    this.statutsMasques.update(masques => {
      const suivant = new Set(masques);
      if (suivant.has(statut)) suivant.delete(statut); else suivant.add(statut);
      return suivant;
    });
  }

  statutVisible(statut: StatutReservation): boolean { return !this.statutsMasques().has(statut); }

  choisirEquipement(nom: string): void { this.equipementFiltre.set(nom); }

  reinitialiserFiltres(): void {
    this.statutsMasques.set(new Set());
    this.equipementFiltre.set('');
  }

  // --- Affichage ---

  statut(evenement: EvenementCalendrier) { return affichageStatut(evenement.reservation.statut); }

  pastilles(jour: CalendarDay): EvenementCalendrier[] { return jour.evenements.slice(0, PASTILLES_MAX); }
  surplus(jour: CalendarDay): number { return Math.max(jour.evenements.length - PASTILLES_MAX, 0); }

  quoi(r: Reservation): string {
    return r.equipements_noms?.length ? r.equipements_noms.join(', ') : 'Salle (aucun équipement)';
  }

  horaire(r: Reservation): string { return `${r.heure_debut.slice(0, 5)} – ${r.heure_fin.slice(0, 5)}`; }

  libelleAccessibleJour(jour: CalendarDay): string {
    const nombre = jour.evenements.length;
    const aujourdhui = jour.estAujourdhui ? ", aujourd'hui" : '';
    return `${this.libelleJour(jour.key)}${aujourdhui}, ${nombre ? accord(nombre, 'réservation') : 'aucune réservation'}`;
  }

  libelleAccessibleEvenement(e: EvenementCalendrier): string {
    const r = e.reservation;
    const prefixe = e.aTraiter ? `Demande à traiter de ${r.demandeur_nom}, ` : '';
    return `${prefixe}${this.horaire(r)}, ${this.quoi(r)}, ${r.laboratoire_nom}, ${this.statut(e).libelle}. Voir le détail.`;
  }

  dayClasses(jour: CalendarDay): string {
    const base = 'w-full aspect-square max-w-11 mx-auto rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-colors';
    if (jour.key === this.selectedDate()) return `${base} bg-primary text-white font-semibold`;
    if (jour.estAujourdhui) return `${base} bg-primary-tint text-primary font-semibold ring-1 ring-primary/30`;
    return `${base} ${jour.dansLeMoisCourant ? 'text-text hover:bg-background' : 'text-text-secondary/60 hover:bg-background'}`;
  }

  private libelleJour(cle: string): string {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(this.depuisCle(cle));
  }

  private decalerMois(sens: number): void {
    const d = this.moisAffiche();
    this.moisAffiche.set(new Date(d.getFullYear(), d.getMonth() + sens, 1));
  }

  private ecranEtroit(): boolean {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 639px)').matches;
  }

  private debutDuMois(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private depuisCle(cle: string): Date {
    const [y, m, d] = cle.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private formatKey(d: Date): string {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

// Ordre d'un jour : par heure ; à heure égale, les réservations actives
// avant les annulées ou refusées.
function comparer(a: EvenementCalendrier, b: EvenementCalendrier): number {
  return a.reservation.heure_debut.localeCompare(b.reservation.heure_debut)
    || Number(!affichageStatut(a.reservation.statut).active) - Number(!affichageStatut(b.reservation.statut).active);
}
