import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';

import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';
import { StatusBadge } from '../../../Shared/components/status-badge';

import { UtilisateurService } from '../../../Core/services/utilisateur.service';
import { LaboratoireService } from '../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../Core/services/equipement.service';
import { ReservationService } from '../../../Core/services/reservation.service';
import { MaintenanceService } from '../../../Core/services/maintenance.service';
import { JournalService } from '../../../Core/services/journal.service';
import { MaintenanceFormModal } from '../../maintenances/pages/maintenance-form-modal/maintenance-form-modal';

const MOIS_ABREGES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    DatePipe, RouterLink, TagModule, ButtonModule, TableModule, ChartModule, TooltipModule,
    PageHeader, MiniStatCard, StatusBadge, MaintenanceFormModal,
  ],
  templateUrl: './dashboard-admin.html',
})
export class DashboardAdmin implements OnInit {
  readonly utilisateurService = inject(UtilisateurService);
  readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  readonly reservationService = inject(ReservationService);
  readonly maintenanceService = inject(MaintenanceService);
  readonly journalService = inject(JournalService);

  maintenanceModalVisible = false;

  // --- KPI principaux ---
  readonly totalUtilisateurs = computed(() => this.utilisateurService.utilisateurs().length);
  readonly totalLaboratoires = computed(() => this.laboratoireService.laboratoires().length);
  readonly laboratoiresActifs = computed(() => this.laboratoireService.laboratoires().filter(l => l.statut === 'DISPONIBLE').length);
  readonly totalEquipements = computed(() => this.equipementService.equipements().length);
  readonly equipementsDisponibles = computed(() => this.equipementService.equipements().filter(e => e.statut === 'DISPONIBLE').length);
  readonly totalReservationsCeMois = computed(() => {
    const now = new Date();
    return this.reservationService.reservations().filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  });

  // --- État du parc d'équipements ---
  readonly etatEquipements = computed(() => {
    const eqs = this.equipementService.equipements();
    const compter = (s: string) => eqs.filter(e => e.statut === s).length;
    return [
      { label: 'Disponible', value: compter('DISPONIBLE'), color: 'bg-success' },
      { label: 'Réservé', value: compter('RESERVE'), color: 'bg-primary' },
      { label: 'En maintenance', value: compter('EN_MAINTENANCE'), color: 'bg-accent' },
      { label: 'En panne', value: compter('EN_PANNE'), color: 'bg-danger' },
      { label: 'Hors service', value: compter('HORS_SERVICE'), color: 'bg-text-secondary' },
    ];
  });

  // --- Alertes ---
  readonly equipementsEnPanneCount = computed(() => this.equipementService.equipements().filter(e => e.statut === 'EN_PANNE').length);
  readonly maintenancesCetteSemaine = computed(() => {
    const dansUneSemaine = new Date();
    dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);
    return this.maintenanceService.maintenances().filter(m => m.statut === 'PLANIFIEE' && new Date(m.date_planifiee) <= dansUneSemaine).length;
  });
  readonly demandesEnAttenteCount = computed(() => this.reservationService.reservations().filter(r => r.statut === 'EN_ATTENTE').length);

  // --- Évolution des réservations (6 derniers mois) ---
  readonly evolutionChartData = computed(() => {
    const mois = this.derniersMois(6);
    return {
      labels: mois.map(m => m.label),
      datasets: [{
        label: 'Réservations',
        backgroundColor: '#1848D9',
        borderRadius: 6,
        data: mois.map(m => this.reservationService.reservations().filter(r => {
          const d = new Date(r.date);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length),
      }],
    };
  });

  readonly chartOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } },
  };

  // --- Équipements les plus sollicités (30 derniers jours) ---
  readonly topEquipements = computed(() => {
    const depuis = new Date();
    depuis.setDate(depuis.getDate() - 30);
    const compteur = new Map<string, number>();
    for (const r of this.reservationService.reservations()) {
      if (new Date(r.date) < depuis) continue;
      for (const nom of (r as any).equipements_noms ?? []) {
        compteur.set(nom, (compteur.get(nom) ?? 0) + 1);
      }
    }
    const arr = Array.from(compteur.entries()).map(([nom, count]) => ({ nom, count }));
    arr.sort((a, b) => b.count - a.count);
    const max = arr[0]?.count ?? 1;
    return arr.slice(0, 4).map(e => ({ ...e, pct: Math.round((e.count / max) * 100) }));
  });

  // --- Maintenance ---
  readonly maintPlanifiees = computed(() => this.maintenanceService.maintenances().filter(m => m.statut === 'PLANIFIEE').length);
  readonly maintEnCours = computed(() => this.maintenanceService.maintenances().filter(m => m.statut === 'EN_COURS').length);
  readonly maintTermineesCeMois = computed(() => {
    const now = new Date();
    return this.maintenanceService.maintenances().filter(m =>
      m.statut === 'TERMINEE' && m.date_fin &&
      new Date(m.date_fin).getMonth() === now.getMonth() && new Date(m.date_fin).getFullYear() === now.getFullYear()
    ).length;
  });

  // --- Réservations récentes ---
  readonly reservationsRecentes = computed(() =>
    [...this.reservationService.reservations()].sort((a, b) => b.date_creation.localeCompare(a.date_creation)).slice(0, 6)
  );

  // --- Activité récente ---
  readonly activitesRecentes = computed(() => this.journalService.entrees().slice(0, 5));

  ngOnInit(): void {
    this.utilisateurService.charger();
    this.laboratoireService.charger();
    this.equipementService.charger();
    this.reservationService.charger({ all: true });
    this.maintenanceService.charger();
    this.journalService.charger();
  }

  private derniersMois(n: number): { year: number; month: number; label: string }[] {
    const now = new Date();
    const mois = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mois.push({ year: d.getFullYear(), month: d.getMonth(), label: MOIS_ABREGES[d.getMonth()] });
    }
    return mois;
  }

  statusLabel(s: string) {
    return { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REFUSEE: 'Refusée', ANNULEE: 'Annulée', TERMINEE: 'Terminée' }[s] ?? s;
  }

  actionIcon(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('réservation')) return 'pi pi-calendar';
    if (a.includes('maintenance')) return 'pi pi-wrench';
    if (a.includes('utilisateur') || a.includes('compte')) return 'pi pi-user-plus';
    if (a.includes('laboratoire')) return 'pi pi-building';
    if (a.includes('équipement')) return 'pi pi-cog';
    return 'pi pi-info-circle';
  }
}
