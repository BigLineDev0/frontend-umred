import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { ReservationService } from '../../../Core/services/reservation.service';
import { MaintenanceService } from '../../../Core/services/maintenance.service';
import { JournalService } from '../../../Core/services/journal.service';
import { LaboratoireService } from '../../../Core/services/laboratoire.service';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { AnimatedNumber } from '../../../Shared/components/animated-number/animated-number';
import { calculerPlage, isoDate, PeriodeCle } from '../../../Shared/utils/date-range';
import { environment } from '../../../../environments/environment';

const MOIS_ABREGES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Correspondance entre le code de rôle stocké en base (ADMIN, TECHNICIEN...)
// et le libellé lisible affiché dans la carte "Par type d'utilisateur".
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateurs',
  TECHNICIEN: 'Techniciens',
  CHERCHEUR: 'Enseignants-chercheurs',
  ETUDIANT: 'Étudiants',
};

@Component({
  standalone: true,
  selector: 'app-rapports',
  templateUrl: './rapports.html',
  imports: [ButtonModule, ChartModule, DatePickerModule, SelectModule, FormsModule, PageHeader, AnimatedNumber],
})
export class Rapports implements OnInit {
  private http = inject(HttpClient);
  private reservationService = inject(ReservationService);
  private maintenanceService = inject(MaintenanceService);
  private journalService = inject(JournalService);
  private laboratoireService = inject(LaboratoireService);

  periode = signal<PeriodeCle>('7j');
  customDebut = signal<Date | null>(null);
  customFin = signal<Date | null>(null);
  utilisateursActifs = signal(0);

  // ajouté : mémorise le laboratoire choisi dans le filtre (null = tous)
  laboratoireFiltre = signal<number | null>(null);

  periodeOptions: { label: string; value: PeriodeCle }[] = [
    { label: "Aujourd'hui", value: 'today' },
    { label: '7 jours', value: '7j' },
    { label: '30 jours', value: '30j' },
    { label: '3 mois', value: '3m' },
    { label: 'Personnalisé', value: 'custom' },
  ];

  readonly reservationsPeriode = this.reservationService.reservations;
  readonly maintenancesPeriode = this.maintenanceService.maintenances;

  readonly totalReservations = computed(() => this.reservationsPeriode().length);

  readonly equipementsUtilisesCount = computed(() => {
    const ids = new Set<number>();
    for (const r of this.reservationsPeriode()) for (const id of r.equipements ?? []) ids.add(id);
    return ids.size;
  });

  readonly totalMaintenances = computed(() => this.maintenancesPeriode().length);

  // ajouté : options du menu déroulant "laboratoire", reconstruites
  // automatiquement dès que la liste des laboratoires est chargée
  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map(l => ({ label: l.nom, value: l.id })),
  ]);

  readonly chartData = computed(() => {
    const { debut, fin } = calculerPlage(this.periode(), this.customDebut(), this.customFin());
    const nbJours = Math.round((fin.getTime() - debut.getTime()) / 86400000);
    const parJour = nbJours <= 31;

    const cles: string[] = [];
    const labels: string[] = [];
    if (parJour) {
      for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
        cles.push(isoDate(d));
        labels.push(`${d.getDate()} ${MOIS_ABREGES[d.getMonth()]}`);
      }
    } else {
      const curseur = new Date(debut.getFullYear(), debut.getMonth(), 1);
      while (curseur <= fin) {
        cles.push(`${curseur.getFullYear()}-${curseur.getMonth()}`);
        labels.push(MOIS_ABREGES[curseur.getMonth()]);
        curseur.setMonth(curseur.getMonth() + 1);
      }
    }

    const compteur = new Map(cles.map(c => [c, 0]));
    for (const r of this.reservationsPeriode()) {
      const d = new Date(r.date);
      const cle = parJour ? r.date : `${d.getFullYear()}-${d.getMonth()}`;
      if (compteur.has(cle)) compteur.set(cle, (compteur.get(cle) ?? 0) + 1);
    }

    return { labels, datasets: [{ label: 'Réservations', backgroundColor: '#1848D9', borderRadius: 6, data: cles.map(c => compteur.get(c) ?? 0) }] };
  });

  readonly chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } },
  };

  readonly usageEquipements = computed(() => {
    const compteur = new Map<string, number>();
    for (const r of this.reservationsPeriode()) for (const nom of r.equipements_noms ?? []) compteur.set(nom, (compteur.get(nom) ?? 0) + 1);
    const arr = Array.from(compteur.entries()).map(([nom, count]) => ({ nom, count }));
    arr.sort((a, b) => b.count - a.count);
    const max = arr[0]?.count ?? 1;
    return arr.slice(0, 5).map(e => ({ ...e, pct: Math.round((e.count / max) * 100) }));
  });

  readonly maintenancesPreventives = computed(() => this.maintenancesPeriode().filter(m => m.type === 'PREVENTIVE').length);
  readonly maintenancesCorrectives = computed(() => this.maintenancesPeriode().filter(m => m.type === 'CORRECTIVE').length);
  readonly maintenancesTerminees = computed(() => this.maintenancesPeriode().filter(m => m.statut === 'TERMINEE').length);
  readonly maintenancesEnCours = computed(() => this.maintenancesPeriode().filter(m => m.statut === 'EN_COURS').length);

  // ajouté : répartition des réservations par rôle de demandeur (ADMIN,
  // TECHNICIEN, CHERCHEUR, ETUDIANT), avec un pourcentage pour la barre
  // de progression affichée dans la nouvelle carte "Par type d'utilisateur".
  // Nécessite que ReservationSerializer expose bien le champ demandeur_role.
  readonly repartitionParRole = computed(() => {
    const compteur: Record<string, number> = {};
    for (const r of this.reservationsPeriode()) {
      const role = (r as any).demandeur_role as string | undefined;
      const label = ROLE_LABELS[role ?? ''] ?? 'Autre';
      compteur[label] = (compteur[label] ?? 0) + 1;
    }
    const total = this.reservationsPeriode().length || 1; // évite une division par zéro si aucune réservation
    return Object.entries(compteur)
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => ({ label, n, pct: Math.round((n / total) * 100) }));
  });

  ngOnInit(): void {
    this.laboratoireService.charger(); // ajouté : charge la liste pour remplir le filtre
    this.recharger();
  }

  changerPeriode(p: PeriodeCle): void {
    this.periode.set(p);
    if (p !== 'custom') this.recharger();
  }

  appliquerPeriodePersonnalisee(): void {
    if (this.customDebut() && this.customFin()) this.recharger();
  }

  // ajouté : appelé quand l'utilisateur change le laboratoire sélectionné
  onLaboratoireChange(): void {
    this.recharger();
  }

  private recharger(): void {
    const { debut, fin } = calculerPlage(this.periode(), this.customDebut(), this.customFin());
    const dateDebut = isoDate(debut), dateFin = isoDate(fin);
    // ajouté : undefined plutôt que null, pour que le service n'ajoute
    // pas le paramètre "laboratoire" à l'URL quand aucun n'est choisi
    const laboratoire = this.laboratoireFiltre() ?? undefined;

    this.reservationService.charger({ all: true, dateDebut, dateFin, archivees: true, laboratoire });
    this.maintenanceService.charger({ dateDebut, dateFin });

    this.journalService.chargerPourAgregation({ action: 'connexion', dateDebut, dateFin }).subscribe(entrees => {
      const ids = new Set(entrees.filter(e => !e.action.toLowerCase().includes('déconnexion')).map(e => e.auteur).filter(Boolean));
      this.utilisateursActifs.set(ids.size);
    });
  }

  exporterPdf(): void { window.print(); }

  // ajouté : télécharge le classeur Excel généré par Django. On utilise
  // responseType: 'blob' car la réponse n'est pas du JSON mais un vrai
  // fichier binaire — sans ce réglage, Angular tenterait de le parser
  // comme du JSON et échouerait silencieusement.
  exporterExcel(): void {
    const { debut, fin } = calculerPlage(this.periode(), this.customDebut(), this.customFin());
    let params = new HttpParams().set('date_debut', isoDate(debut)).set('date_fin', isoDate(fin));
    if (this.laboratoireFiltre()) {
      params = params.set('laboratoire', String(this.laboratoireFiltre()));
    }

    this.http.get(`${environment.apiUrl}/rapports/export/`, { params, responseType: 'blob' }).subscribe(blob => {
      // Un blob n'est pas cliquable tel quel : on crée une URL temporaire
      // en mémoire, on simule un clic sur un lien invisible pour déclencher
      // le téléchargement, puis on libère cette URL (sinon elle reste en
      // mémoire tant que la page est ouverte).
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_umred_labo_${isoDate(new Date())}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
