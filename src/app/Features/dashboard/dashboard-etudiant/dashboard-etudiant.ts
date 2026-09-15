import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';
import { ReservationsCalendar } from '../../../Shared/components/reservations-calendar/reservations-calendar';

import { LaboratoireService } from '../../../Core/services/laboratoire.service';
import { NotificationService } from '../../../Core/services/notification.service';
import { ReservationService } from '../../../Core/services/reservation.service';

@Component({
  selector: 'app-dashboard-etudiant',
  standalone: true,
  imports: [DatePipe, RouterLink, TagModule, ButtonModule, PageHeader, MiniStatCard, ReservationsCalendar],
  templateUrl: './dashboard-etudiant.html',
})
export class DashboardEtudiant implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  readonly notificationService = inject(NotificationService);

  readonly reservations = this.reservationService.reservations;

  readonly total = computed(() => this.reservations().length);
  readonly validees = computed(() => this.reservations().filter(r => r.statut === 'VALIDEE').length);
  readonly enAttente = computed(() => this.reservations().filter(r => r.statut === 'EN_ATTENTE').length);
  readonly refusees = computed(() => this.reservations().filter(r => r.statut === 'REFUSEE').length);

  readonly prochainesReservations = computed(() => {
    const aujourdHui = new Date().toISOString().split('T')[0];
    return this.reservations()
      .filter(r => (r.statut === 'VALIDEE' || r.statut === 'EN_ATTENTE') && r.date >= aujourdHui)
      .sort((a, b) => a.date.localeCompare(b.date) || a.heure_debut.localeCompare(b.heure_debut))
      .slice(0, 3);
  });

  readonly laboratoiresDisponibles = computed(() => this.laboratoireService.laboratoires().slice(0, 4));
  readonly notificationsRecentes = computed(() => this.notificationService.notifications().slice(0, 3));

  ngOnInit(): void {
    this.reservationService.charger();
    this.laboratoireService.charger();
    this.notificationService.charger();
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
