import { Component, computed, input, signal } from '@angular/core';
import { Reservation } from '../../../Core/models/reservation.model';

interface CalendarDay {
  key: string;
  jour: number;
  dansLeMoisCourant: boolean;
  estAujourdhui: boolean;
  reservations: Reservation[];
}

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

@Component({
  selector: 'app-reservations-calendar',
  standalone: true,
  templateUrl: './reservations-calendar.html',
})
export class ReservationsCalendar {
  // Reçoit une liste déjà chargée par la page parente — pas d'appel API
  // ici, ce composant reste purement présentationnel (même logique que
  // StatCard ou DataTable). Il se met à jour "en temps réel" simplement
  // parce que le signal source change après chaque action utilisateur.
  reservations = input<Reservation[]>([]);

  readonly joursSemaine = JOURS_SEMAINE;

  private moisAffiche = signal(this.debutDuMois(new Date()));
  selectedDate = signal<string>(this.formatKey(new Date()));

  readonly libelleMois = computed(() => {
    const d = this.moisAffiche();
    return `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  });

  private reservationsParJour = computed(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of this.reservations()) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return map;
  });

  readonly jours = computed<CalendarDay[]>(() => {
    const mois = this.moisAffiche();
    const premierJourMois = new Date(mois.getFullYear(), mois.getMonth(), 1);
    const decalage = (premierJourMois.getDay() + 6) % 7; // grille commence le lundi
    const debutGrille = new Date(premierJourMois);
    debutGrille.setDate(debutGrille.getDate() - decalage);

    const parJour = this.reservationsParJour();
    const aujourdHui = this.formatKey(new Date());
    const jours: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(debutGrille);
      date.setDate(date.getDate() + i);
      const key = this.formatKey(date);
      jours.push({
        key,
        jour: date.getDate(),
        dansLeMoisCourant: date.getMonth() === mois.getMonth(),
        estAujourdhui: key === aujourdHui,
        reservations: parJour.get(key) ?? [],
      });
    }
    return jours;
  });

  readonly reservationsDuJourSelectionne = computed(() =>
    (this.reservationsParJour().get(this.selectedDate()) ?? [])
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
  );

  readonly dateSelectionneeLabel = computed(() => {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
  });

  moisPrecedent(): void {
    const d = this.moisAffiche();
    this.moisAffiche.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  moisSuivant(): void {
    const d = this.moisAffiche();
    this.moisAffiche.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  aujourdHui(): void {
    const now = new Date();
    this.moisAffiche.set(this.debutDuMois(now));
    this.selectedDate.set(this.formatKey(now));
  }

  selectionnerJour(jour: CalendarDay): void {
    this.selectedDate.set(jour.key);
  }

  dayClasses(jour: CalendarDay): string {
    const base = 'w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-colors';
    if (jour.key === this.selectedDate()) return `${base} bg-primary text-white font-semibold`;
    if (jour.estAujourdhui) return `${base} bg-background text-text font-semibold`;
    return `${base} ${jour.dansLeMoisCourant ? 'text-text hover:bg-background' : 'text-text-secondary/40'}`;
  }

  dotColor(statut: string): string {
    return { EN_ATTENTE: 'bg-accent', VALIDEE: 'bg-success', REFUSEE: 'bg-danger', ANNULEE: 'bg-text-secondary', TERMINEE: 'bg-primary' }[statut] ?? 'bg-primary';
  }

  private debutDuMois(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private formatKey(d: Date): string {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
