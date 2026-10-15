import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Reservation } from '../../Core/models/reservation.model';
import { ReservationService } from '../../Core/services/reservation.service';
import { aujourdHuiEtablissement } from '../../Shared/utils/statut-reservation';
import { DashboardChercheur } from './dashboard-chercheur/dashboard-chercheur';
import { DashboardEtudiant } from './dashboard-etudiant/dashboard-etudiant';

// Réservations au FORMAT DE L'API DJANGO (ReservationSerializer : date AAAA-MM-JJ,
// heures HH:MM:SS, equipements_noms, laboratoire_nom, statut). Le contrat
// côté Django est vérifié par backend/apps/reservations/tests_calendrier.py.
const AUJOURDHUI = aujourdHuiEtablissement();

function api(id: number, extra: Partial<Reservation> = {}): Reservation {
  return {
    id, demandeur: 1, demandeur_nom: 'Awa Diop', validateur: null, laboratoire: 10, laboratoire_nom: 'Labo Biologie',
    equipements: [3], equipements_noms: ['Centrifugeuse Eppendorf'], date: AUJOURDHUI, heure_debut: '14:00:00',
    heure_fin: '16:00:00', motif: 'TP', statut: 'VALIDEE', date_creation: '2026-10-01T09:00:00Z', date_validation: null,
    est_archivee: false, annulable: true, ...extra,
  };
}

// jsdom ne fournit pas matchMedia (utilisé par animated-number des cartes de
// statistiques) : grand écran, sans préférence de mouvement réduit.
function ecran(etroit = false): void {
  window.matchMedia = ((requete: string) => ({ matches: etroit && requete.includes('max-width'), media: requete,
    addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

beforeEach(() => ecran());

function configurer() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService],
  });
  return TestBed.inject(HttpTestingController);
}

// Répond à toutes les requêtes en attente selon l'URL (les dashboards chargent aussi
// laboratoires, notifications, profil...).
function repondre(http: HttpTestingController, reponses: { reservations?: unknown; fileAttente?: unknown; erreurReservations?: boolean }) {
  for (const req of http.match(() => true)) {
    const url = req.request.urlWithParams;
    if (url.includes('/reservations/file_attente/')) req.flush(reponses.fileAttente ?? []);
    else if (url.includes('/reservations/')) {
      if (reponses.erreurReservations) req.flush({ detail: 'Serveur indisponible.' }, { status: 503, statusText: 'Service Unavailable' });
      else req.flush(reponses.reservations ?? []);
    } else if (url.includes('/notifications/')) req.flush({ count: 0, results: [] });
    else if (url.includes('/utilisateurs/moi/')) req.flush({ encadrant_nom: 'Moussa Sow' });
    else req.flush([]);
  }
}

function lignesDuJour(element: HTMLElement): string[] {
  return [...element.querySelectorAll('app-reservations-calendar ul li')].map(li => li.textContent ?? '');
}

describe('Calendriers des dashboards (données de l’API)', () => {
  it('Étudiant : affiche exactement les réservations renvoyées par Django, avec statut et horaire', () => {
    const http = configurer();
    const fixture = TestBed.createComponent(DashboardEtudiant);
    fixture.detectChanges();
    repondre(http, { reservations: [api(1), api(2, { statut: 'ANNULEE', heure_debut: '08:00:00', heure_fin: '09:00:00' })] });
    fixture.detectChanges();
    const calendrier = fixture.nativeElement as HTMLElement;
    const lignes = lignesDuJour(calendrier);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toContain('08:00 – 09:00');
    expect(lignes[0]).toContain('Annulée');
    expect(lignes[1]).toContain('14:00 – 16:00');
    expect(lignes[1]).toContain('Validée');
    expect(lignes[1]).toContain('Centrifugeuse Eppendorf');
    // L'étudiant n'a pas de demandes « à traiter » : aucune requête vers la file des validateurs.
    http.expectNone(r => r.url.includes('/reservations/file_attente/'));
    expect(calendrier.textContent).not.toContain('À traiter (vos étudiants)');
  });

  it('Étudiant : une erreur de l’API est affichée et récupérable, sans faux calendrier vide', () => {
    const http = configurer();
    const fixture = TestBed.createComponent(DashboardEtudiant);
    fixture.detectChanges();
    repondre(http, { erreurReservations: true });
    fixture.detectChanges();
    const calendrier = (fixture.nativeElement as HTMLElement).querySelector('app-reservations-calendar')!;
    expect(calendrier.querySelector('[role="alert"]')?.textContent).toContain('Serveur indisponible');
    expect(calendrier.textContent).not.toContain('Aucune réservation ce jour-là');
    calendrier.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    const relance = http.expectOne(r => r.url.endsWith('/reservations/'));
    relance.flush([api(1)]);
    fixture.detectChanges();
    expect(lignesDuJour(fixture.nativeElement)).toHaveLength(1);
  });

  it('Étudiant : le calendrier se met à jour après une annulation', () => {
    const http = configurer();
    const fixture = TestBed.createComponent(DashboardEtudiant);
    fixture.detectChanges();
    repondre(http, { reservations: [api(7)] });
    fixture.detectChanges();
    TestBed.inject(ReservationService).annuler(7).subscribe();
    http.expectOne(r => r.url.endsWith('/reservations/7/annuler/')).flush(api(7, { statut: 'ANNULEE', annulable: false }));
    fixture.detectChanges();
    expect(lignesDuJour(fixture.nativeElement)[0]).toContain('Annulée');
  });

  it('Chercheur : ses réservations et les demandes de ses étudiants à traiter, distinguées', () => {
    const http = configurer();
    const fixture = TestBed.createComponent(DashboardChercheur);
    fixture.detectChanges();
    const demande = { ...api(30, { statut: 'EN_ATTENTE', demandeur: 5, demandeur_nom: 'Fatou Ndiaye', heure_debut: '10:00:00', heure_fin: '12:00:00' }),
                      analyse: { recommandation: 'valider', raison: '', priorite_projet: 'Normale', profil_demandeur: 'Étudiant',
                                 concurrentes: 0, rang: 1, creneau_passe: false, conflit_avec_reservation_validee: false } };
    repondre(http, { reservations: [api(1, { demandeur: 9, demandeur_nom: 'Moussa Sow' })], fileAttente: [demande] });
    fixture.detectChanges();
    const lignes = lignesDuJour(fixture.nativeElement);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toContain('À traiter');
    expect(lignes[0]).toContain('Fatou Ndiaye');
    expect(lignes[1]).toContain('Validée');
  });
});

describe('Calendrier sur mobile', () => {
  it('ouvre la vue agenda sur un écran étroit', () => {
    ecran(true);
    {
      const http = configurer();
      const fixture = TestBed.createComponent(DashboardEtudiant);
      fixture.detectChanges();
      repondre(http, { reservations: [api(1)] });
      fixture.detectChanges();
      const calendrier = (fixture.nativeElement as HTMLElement).querySelector('app-reservations-calendar')!;
      expect(calendrier.querySelector('[role="grid"]')).toBeNull();
      expect(calendrier.querySelectorAll('section')).toHaveLength(1);
      expect(calendrier.textContent).toContain('1 réservation en');
    }
  });
});
