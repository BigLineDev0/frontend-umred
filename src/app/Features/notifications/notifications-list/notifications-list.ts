import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TypeNotification } from '../../../Core/models/notification.model';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { NotificationService } from '../../../Core/services/notification.service';
import { AuthService } from '../../../Core/services/auth.service';
import { Notification, NotificationPage } from '../../../Core/models/notification.model';


const NOTIF_STYLE: Record<TypeNotification, { icon: string; bg: string; color: string }> = {
  RESERVATION: { icon: 'pi pi-calendar', bg: 'bg-primary/10', color: 'text-primary' },
  MAINTENANCE: { icon: 'pi pi-wrench', bg: 'bg-accent/10', color: 'text-accent' },
  VALIDATION:  { icon: 'pi pi-check-circle', bg: 'bg-success/10', color: 'text-success' },
  RAPPEL:      { icon: 'pi pi-clock', bg: 'bg-accent/10', color: 'text-accent' },
  SYSTEME:     { icon: 'pi pi-info-circle', bg: 'bg-primary/10', color: 'text-primary' },
};

const PAGE_SIZE = 10;

@Component({
  standalone: true,
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.html',
  imports: [NgClass, FormsModule, ButtonModule, SelectModule, PageHeader],
})
export class NotificationsList implements OnInit {
  readonly notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedType = signal<string | null>(null);
  selectedLu = signal<boolean | null>(null);
  page = signal(1);

  typeOptions = [
    { label: 'Tous les types', value: null },
    { label: 'Réservation', value: 'RESERVATION' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Validation', value: 'VALIDATION' },
    { label: 'Rappel', value: 'RAPPEL' },
    { label: 'Système', value: 'SYSTEME' },
  ];
  luOptions = [
    { label: 'Toutes', value: null },
    { label: 'Non lues', value: false },
    { label: 'Lues', value: true },
  ];

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.notificationService.total() / PAGE_SIZE)));

  ngOnInit(): void { this.recharger(); }

  onFiltreChange(): void { this.page.set(1); this.recharger(); }

  private recharger(): void {
    this.notificationService.charger({
      type: this.selectedType() ?? undefined,
      lu: this.selectedLu() ?? undefined,
      page: this.page(), pageSize: PAGE_SIZE,
    });
  }

  pagePrecedente(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.recharger(); } }
  pageSuivante(): void { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.recharger(); } }

  styleFor(type: TypeNotification) { return NOTIF_STYLE[type]; }
  marquerToutesLues(): void { this.notificationService.marquerToutesLues().subscribe(); }

  ouvrirNotification(n: Notification): void {
    if (!n.lu) this.notificationService.marquerLue(n.id).subscribe();
    if (n.entite_type_nom === 'maintenance' && n.entite_id) {
      this.router.navigate(['/maintenances', n.entite_id]);
      return;
    }
    if (n.entite_type_nom === 'reservation') {
      const role = this.authService.currentUser()?.role;
      const route = role === 'ETUDIANT' ? '/etudiant/dashboard/mes-demandes'
        : role === 'CHERCHEUR' ? '/enseignant/dashboard/reservations'
        : '/reservations/a-valider';
      this.router.navigate([route]);
    }
  }

  tempsEcoule(dateIso: string): string {
    const minutes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures} h`;
    return `Il y a ${Math.floor(heures / 24)} j`;
  }
}
