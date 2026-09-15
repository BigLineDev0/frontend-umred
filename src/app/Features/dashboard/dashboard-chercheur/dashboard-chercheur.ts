import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';
import { ReservationsCalendar } from '../../../Shared/components/reservations-calendar/reservations-calendar';


import { LaboratoireService } from '../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../Core/services/equipement.service';
import { NotificationService } from '../../../Core/services/notification.service';
import { ReservationService } from '../../../Core/services/reservation.service';

@Component({
  selector: 'app-dashboard-chercheur',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, TagModule, PageHeader, MiniStatCard, ReservationsCalendar],
  templateUrl: './dashboard-chercheur.html',
})
export class DashboardChercheur implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  readonly notificationService = inject(NotificationService);

  readonly reservations = this.reservationService.reservations;

  readonly validees = computed(() => this.reservations().filter(r => r.statut === 'VALIDEE').length);
  readonly annulees = computed(() => this.reservations().filter(r => r.statut === 'ANNULEE').length);
  readonly terminees = computed(() => this.reservations().filter(r => r.statut === 'TERMINEE').length);
  readonly equipementsDisponibles = computed(() => this.equipementService.equipements().filter(e => e.statut === 'DISPONIBLE').length);

  readonly prochainesReservations = computed(() => {
    const aujourdHui = new Date().toISOString().split('T')[0];
    return this.reservations()
      .filter(r => r.statut === 'VALIDEE' && r.date >= aujourdHui)
      .sort((a, b) => a.date.localeCompare(b.date) || a.heure_debut.localeCompare(b.heure_debut))
      .slice(0, 3);
  });

  readonly laboratoiresFrequents = computed(() => this.laboratoireService.laboratoires().slice(0, 4));
  readonly notificationsRecentes = computed(() => this.notificationService.recentes().slice(0, 3));

  ngOnInit(): void {
    this.reservationService.charger();
    this.laboratoireService.charger();
    this.equipementService.charger();
    this.notificationService.chargerRecentes();
  }

  statusLabel(s: string) { return { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REFUSEE: 'Refusée', ANNULEE: 'Annulée', TERMINEE: 'Terminée' }[s] ?? s; }
  statusSeverity(s: string) { return ({ EN_ATTENTE: 'warn', VALIDEE: 'success', REFUSEE: 'danger', ANNULEE: 'secondary', TERMINEE: 'info' } as const)[s] ?? 'info'; }

  tempsEcoule(dateIso: string): string {
    const heures = Math.floor((Date.now() - new Date(dateIso).getTime()) / 3600000);
    if (heures < 1) return "À l'instant";
    if (heures < 24) return `Il y a ${heures} heure${heures > 1 ? 's' : ''}`;
    const jours = Math.floor(heures / 24);
    return `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
  }
}
