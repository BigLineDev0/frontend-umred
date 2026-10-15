import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reservation, StatutReservation } from '../../../Core/models/reservation.model';
import { aujourdHuiEtablissement } from '../../utils/statut-reservation';
import { ReservationsCalendar } from './reservations-calendar';

const AUJOURDHUI = aujourdHuiEtablissement();

function decaler(cle: string, jours: number): string {
  const [y, m, d] = cle.split('-').map(Number);
  const date = new Date(y, m - 1, d + jours);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

let prochainId = 1;
function reservation(extra: Partial<Reservation> = {}): Reservation {
  return {
    id: prochainId++, demandeur: 1, demandeur_nom: 'Awa Diop', validateur: null, laboratoire: 10,
    laboratoire_nom: 'Labo Biologie', equipements: [3], equipements_noms: ['Centrifugeuse'], date: AUJOURDHUI,
    heure_debut: '10:00:00', heure_fin: '12:00:00', motif: 'TP', statut: 'VALIDEE' as StatutReservation,
    date_creation: '', date_validation: null, est_archivee: false, ...extra,
  };
}

describe('ReservationsCalendar', () => {
  let fixture: ComponentFixture<ReservationsCalendar>;
  let composant: ReservationsCalendar;
  const element = () => fixture.nativeElement as HTMLElement;
  const texte = () => element().textContent ?? '';

  function afficher(entrees: Partial<Record<'reservations' | 'aTraiter' | 'chargement' | 'erreur', unknown>>): void {
    for (const [nom, valeur] of Object.entries(entrees)) fixture.componentRef.setInput(nom, valeur);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ReservationsCalendar] });
    fixture = TestBed.createComponent(ReservationsCalendar);
    composant = fixture.componentInstance;
    composant.vue.set('mois'); // indépendant de la largeur de la fenêtre de test
  });

  it('affiche les réservations du jour avec horaire, équipement et statut en texte', () => {
    afficher({ reservations: [reservation({ heure_debut: '14:00:00', heure_fin: '16:00:00' }), reservation()] });
    const lignes = [...element().querySelectorAll('ul li')].map(li => li.textContent ?? '');
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toContain('10:00 – 12:00'); // triées par heure
    expect(lignes[0]).toContain('Centrifugeuse');
    expect(lignes[0]).toContain('Validée'); // la couleur n'est jamais seule
  });

  it('présente les annulées et refusées en retrait, jamais comme actives', () => {
    afficher({ reservations: [reservation({ statut: 'ANNULEE' }), reservation({ statut: 'REFUSEE', heure_debut: '08:00:00' })] });
    const boutons = [...element().querySelectorAll<HTMLButtonElement>('ul li button')];
    expect(boutons.every(b => b.classList.contains('opacity-70'))).toBe(true);
    expect(texte()).toContain('Annulée');
    expect(texte()).toContain('Refusée');
  });

  it('change de mois sans perdre les données et revient à aujourd’hui', () => {
    afficher({ reservations: [reservation()] });
    const mois = composant.libelleMois();
    composant.moisSuivant();
    fixture.detectChanges();
    expect(composant.libelleMois()).not.toBe(mois);
    composant.aujourdHui();
    fixture.detectChanges();
    expect(composant.libelleMois()).toBe(mois);
    expect(composant.selectedDate()).toBe(AUJOURDHUI);
  });

  it('marque le jour courant pour les technologies d’assistance', () => {
    afficher({ reservations: [] });
    const courant = element().querySelector('[aria-current="date"]');
    expect(courant?.getAttribute('data-cle')).toBe(AUJOURDHUI);
    expect(courant?.getAttribute('aria-label')).toContain('aucune réservation');
  });

  it('filtre par statut depuis la légende', () => {
    afficher({ reservations: [reservation({ statut: 'EN_ATTENTE' }), reservation({ heure_debut: '14:00:00' })] });
    composant.basculerStatut('EN_ATTENTE');
    fixture.detectChanges();
    expect(element().querySelectorAll('ul li')).toHaveLength(1);
    expect(texte()).toContain('Tout afficher');
    composant.reinitialiserFiltres();
    fixture.detectChanges();
    expect(element().querySelectorAll('ul li')).toHaveLength(2);
  });

  it('filtre par équipement', () => {
    afficher({ reservations: [reservation(), reservation({ equipements_noms: ['Microscope'], heure_debut: '14:00:00' })] });
    composant.choisirEquipement('Microscope');
    fixture.detectChanges();
    expect(element().querySelectorAll('ul li')).toHaveLength(1);
    expect(texte()).toContain('Microscope');
  });

  it('distingue un calendrier vide d’un chargement et d’une erreur', () => {
    afficher({ reservations: [], chargement: true });
    expect(element().querySelector('[aria-busy="true"]')).not.toBeNull();

    afficher({ chargement: false });
    expect(texte()).toContain('Aucune réservation ce jour-là.');

    let relance = 0;
    composant.reessayer.subscribe(() => relance++);
    afficher({ erreur: 'Impossible de charger les réservations.' });
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');
    expect(texte()).not.toContain('Aucune réservation ce jour-là.'); // pas de fausse impression de calendrier vide
    element().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    expect(relance).toBe(1);
  });

  it('ouvre le détail d’une réservation', () => {
    const r = reservation();
    afficher({ reservations: [r] });
    let ouverte: Reservation | undefined;
    composant.ouvrir.subscribe(x => (ouverte = x));
    element().querySelector<HTMLButtonElement>('ul li button')!.click();
    expect(ouverte).toBe(r);
  });

  it('affiche les demandes à traiter du chercheur, distinctes de ses réservations', () => {
    afficher({ reservations: [reservation()], aTraiter: [reservation({ statut: 'EN_ATTENTE', demandeur_nom: 'Moussa Ndiaye', heure_debut: '14:00:00' })] });
    const lignes = [...element().querySelectorAll('ul li')].map(li => li.textContent ?? '');
    expect(lignes[1]).toContain('À traiter');
    expect(lignes[1]).toContain('Moussa Ndiaye');
    expect(texte()).toContain('À traiter (vos étudiants)');
  });

  it('ne mélange pas les jours ni ne duplique les événements', () => {
    const demain = decaler(AUJOURDHUI, 1);
    afficher({ reservations: [reservation(), reservation({ date: demain })] });
    expect(element().querySelectorAll('ul li')).toHaveLength(1);
    const jour = composant.jours().find(j => j.key === demain)!;
    composant.selectionnerJour(jour);
    fixture.detectChanges();
    expect(element().querySelectorAll('ul li')).toHaveLength(1);
  });

  it('se navigue au clavier : flèches, une seule case atteignable par Tab', () => {
    afficher({ reservations: [] });
    expect(element().querySelectorAll('[role="gridcell"] button[tabindex="0"]')).toHaveLength(1);
    const grille = element().querySelector<HTMLElement>('[role="grid"]')!;
    grille.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(composant.selectedDate()).toBe(decaler(AUJOURDHUI, 1));
    grille.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(composant.selectedDate()).toBe(decaler(AUJOURDHUI, -6));
  });

  it('reste atteignable au clavier après un changement de mois', () => {
    afficher({ reservations: [] });
    composant.moisSuivant();
    composant.moisSuivant();
    fixture.detectChanges();
    const focalisables = element().querySelectorAll('[role="gridcell"] button[tabindex="0"]');
    expect(focalisables).toHaveLength(1);
    expect(focalisables[0].getAttribute('data-cle')!.endsWith('-01')).toBe(true);
  });

  it('vue agenda : liste du mois groupée par jour', () => {
    afficher({ reservations: [reservation(), reservation({ heure_debut: '14:00:00' })] });
    composant.changerVue('agenda');
    fixture.detectChanges();
    expect(element().querySelectorAll('section')).toHaveLength(1);
    expect(texte()).toContain('2 réservations en');
  });
});
