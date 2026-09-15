import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../Core/services/reservation.service';
import { MaintenanceService } from '../../../Core/services/maintenance.service';
import { JournalService } from '../../../Core/services/journal.service';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { AnimatedNumber } from '../../../Shared/components/animated-number/animated-number';
import { calculerPlage, isoDate, PeriodeCle } from '../../../Shared/utils/date-range';


const MOIS_ABREGES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

@Component({
  standalone: true,
  selector: 'app-rapports',
  templateUrl: './rapports.html',
  imports: [ButtonModule, ChartModule, DatePickerModule, FormsModule, PageHeader, AnimatedNumber],
})
export class Rapports implements OnInit {
  private reservationService = inject(ReservationService);
  private maintenanceService = inject(MaintenanceService);
  private journalService = inject(JournalService);

  periode = signal<PeriodeCle>('7j');
  customDebut = signal<Date | null>(null);
  customFin = signal<Date | null>(null);
  utilisateursActifs = signal(0);

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

  ngOnInit(): void { this.recharger(); }

  changerPeriode(p: PeriodeCle): void {
    this.periode.set(p);
    if (p !== 'custom') this.recharger();
  }

  appliquerPeriodePersonnalisee(): void {
    if (this.customDebut() && this.customFin()) this.recharger();
  }

  private recharger(): void {
    const { debut, fin } = calculerPlage(this.periode(), this.customDebut(), this.customFin());
    const dateDebut = isoDate(debut), dateFin = isoDate(fin);

    this.reservationService.charger({ all: true, dateDebut, dateFin, archivees: true });
    this.maintenanceService.charger({ dateDebut, dateFin });

    this.journalService.chargerPourAgregation({ action: 'connexion', dateDebut, dateFin }).subscribe(entrees => {
      const ids = new Set(entrees.filter(e => !e.action.toLowerCase().includes('déconnexion')).map(e => e.auteur).filter(Boolean));
      this.utilisateursActifs.set(ids.size);
    });
  }

  exporterPdf(): void { window.print(); }
}
