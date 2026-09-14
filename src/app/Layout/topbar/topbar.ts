import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RouterLink } from '@angular/router';
import { LayoutService } from '../../Core/services/layout.service';
import { AuthService } from '../../Core/services/auth.service';
import { NgClass } from '@angular/common';

export type NotificationType = 'RESERVATION' | 'MAINTENANCE' | 'SYSTEME';

export interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  type: NotificationType;
  lu: boolean;
  tempsEcoule: string;
}

const NOTIF_STYLE: Record<NotificationType, { icon: string; bg: string; color: string }> = {
  RESERVATION: { icon: 'pi pi-calendar', bg: 'bg-primary/10', color: 'text-primary' },
  MAINTENANCE: { icon: 'pi pi-exclamation-triangle', bg: 'bg-accent/10', color: 'text-accent' },
  SYSTEME: { icon: 'pi pi-plus', bg: 'bg-success/10', color: 'text-success' },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    ButtonModule,
    AvatarModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    RouterLink,
    NgClass,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  profileMenuOpen = signal(false);
  notifPanelOpen = signal(false);

  // TODO : remplacer par un appel à GET /api/notifications/ une fois la page branchée sur l'API.
  notifications = signal<NotificationItem[]>([
    {
      id: 1,
      titre: 'Réservation confirmée',
      message: 'Votre demande pour le laboratoire de Bio-Tech a été validée pour demain à 14h.',
      type: 'RESERVATION',
      lu: false,
      tempsEcoule: 'Il y a 2 min',
    },
    {
      id: 2,
      titre: 'Alerte maintenance',
      message: "Le spectrophotomètre UV-Vis nécessite une maintenance préventive d'ici 3 jours.",
      type: 'MAINTENANCE',
      lu: true,
      tempsEcoule: 'Il y a 3 min',
    },
    {
      id: 3,
      titre: 'Nouvel équipement',
      message: "Une nouvelle imprimante 3D résine a été ajoutée à l'inventaire du département.",
      type: 'SYSTEME',
      lu: true,
      tempsEcoule: 'Hier',
    },
  ]);

  unreadCount = computed(() => this.notifications().filter((n) => !n.lu).length);
  unreadCountLabel = computed(() => (this.unreadCount() > 9 ? '9+' : String(this.unreadCount())));

  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);

  user = this.authService.currentUser;

  initials = computed(() => {
    const u = this.user();
    return u ? `${u.prenom[0]}${u.nom[0]}`.toUpperCase() : '';
  });

  constructor(private elementRef: ElementRef) {}

  styleFor(type: NotificationType) {
    return NOTIF_STYLE[type];
  }

  toggleProfileMenu(): void {
    this.notifPanelOpen.set(false);
    this.profileMenuOpen.update((open) => !open);
  }

  toggleNotifPanel(): void {
    this.profileMenuOpen.set(false);
    this.notifPanelOpen.update((open) => !open);
  }

  marquerToutesLues(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, lu: true })));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.profileMenuOpen.set(false);
      this.notifPanelOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  onLogout(): void {
    this.profileMenuOpen.set(false);
    this.authService.logout();
  }
}
