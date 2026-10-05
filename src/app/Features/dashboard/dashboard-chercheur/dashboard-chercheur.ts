import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { SignalerPanneModal } from '../../maintenances/pages/signaler-panne-modal/signaler-panne-modal';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';
import { ReservationsCalendar } from '../../../Shared/components/reservations-calendar/reservations-calendar';


import { LaboratoireService } from '../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../Core/services/equipement.service';
import { NotificationService } from '../../../Core/services/notification.service';
import { ReservationService } from '../../../Core/services/reservation.service';
import { UtilisateurService } from '../../../Core/services/utilisateur.service';
import { Utilisateur } from '../../../Core/models/utilisateur.model';
import { DemandeEnAttente } from '../../../Core/models/reservation.model';
import { isoDate } from '../../../Shared/utils/date-range';

@Component({
  selector: 'app-dashboard-chercheur',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, TagModule, PageHeader, MiniStatCard, ReservationsCalendar, SignalerPanneModal],
  templateUrl: './dashboard-chercheur.html',
})
export class DashboardChercheur implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  readonly notificationService = inject(NotificationService);
  private readonly utilisateurService = inject(UtilisateurService);

  // Encadrement : étudiants rattachés et demandes qu'ils attendent de moi.
  readonly etudiants = signal<Utilisateur[]>([]);
  readonly demandesEtudiants = signal<DemandeEnAttente[]>([]);

  readonly reservations = this.reservationService.reservations;
  readonly panneModalVisible = signal(false);

  readonly validees = computed(() => this.reservations().filter(r => r.statut === 'VALIDEE').length);
  readonly annulees = computed(() => this.reservations().filter(r => r.statut === 'ANNULEE').length);
  readonly terminees = computed(() => this.reservations().filter(r => r.statut === 'TERMINEE').length);
  readonly equipementsDisponibles = computed(() => this.equipementService.equipements().filter(e => e.statut === 'DISPONIBLE').length);

  readonly prochainesReservations = computed(() => {
    const aujourdHui = isoDate(new Date());
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
    this.utilisateurService.mesEtudiants().subscribe({ next: (liste) => this.etudiants.set(liste) });
    this.reservationService.fileAttente().subscribe({ next: (file) => this.demandesEtudiants.set(file) });
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
