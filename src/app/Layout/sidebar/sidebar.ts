import { Component, computed, inject } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../Core/services/layout.service';
import { AuthService } from '../../Core/services/auth.service';
import { NavItem } from '../../Core/models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AvatarModule, DividerModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  initials = computed(() => {
    const u = this.user();
    return u ? `${u.prenom[0]}${u.nom[0]}`.toUpperCase() : '';
  });

  roleLabel = computed(() => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      TECHNICIEN: 'Technicien de laboratoire',
      CHERCHEUR: 'Enseignant-chercheur',
      ETUDIANT: 'Étudiant',
    };
    const role = this.user()?.role;
    return role ? labels[role] : '';
  });

  // Communs à tous les rôles connectés
  private commonItems: NavItem[] = [
    { label: 'Laboratoires', icon: 'pi pi-building', route: '/laboratoires' },
    { label: 'Équipements', icon: 'pi pi-cog', route: '/equipements' },
    { label: 'Consommables', icon: 'pi pi-cog', route: '/consommables'},
    { label: 'Notifications', icon: 'pi pi-bell', route: '/notifications' },
  ];

  // Route réelle : path: 'pannes' dans maintenances.routes.ts → /maintenances/pannes
  private equipementsEnPanneItem: NavItem = {
    label: 'Équipements en panne', icon: 'pi pi-exclamation-triangle', route: '/maintenances/pannes'
  };

  // Centralisé une seule fois pour ADMIN et TECHNICIEN : évite qu'une
  // des deux versions oublie l'exclusion si on modifie cet item plus tard.
  private maintenancesItem: NavItem = {
    label: 'Maintenances', icon: 'pi pi-wrench', route: '/maintenances', excludes: ['/maintenances/pannes']
  };

  private reservationsAValiderItem: NavItem = {
    label: 'Réservations à valider', icon: 'pi pi-check-square', route: '/reservations/a-valider',
  };

  navItems = computed<NavItem[]>(() => {
    const role = this.user()?.role;

    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/admin/dashboard', exact: true },
          this.reservationsAValiderItem,
          ...this.commonItems,
          this.equipementsEnPanneItem,
          this.maintenancesItem,
          { label: 'Utilisateurs', icon: 'pi pi-users', route: '/utilisateurs' },
          { label: 'Rapports', icon: 'pi pi-chart-line', route: '/rapports' },
          { label: "Journal d'activité", icon: 'pi pi-history', route: '/journal-activite' },
        ];

      case 'TECHNICIEN':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/technicien/dashboard', exact: true },
          this.maintenancesItem,
          this.reservationsAValiderItem,
          ...this.commonItems,
          this.equipementsEnPanneItem,
        ];

      case 'CHERCHEUR':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/enseignant/dashboard', exact: true },
          { label: 'Mes réservations', icon: 'pi pi-file-edit', route: '/enseignant/reservations' },
          this.reservationsAValiderItem,
          ...this.commonItems,
        ];

      case 'ETUDIANT':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/etudiant/dashboard', exact: true },
          { label: 'Mes demandes', icon: 'pi pi-file-edit', route: '/etudiant/mes-demandes' },
          ...this.commonItems,
        ];

      default:
        return [];
    }
  });

  isItemActive(item: NavItem): boolean {
    const url = this.router.url;

    if (item.excludes?.some(exclu => url.startsWith(exclu))) {
      return false;
    }

    return item.exact ? url === item.route : url.startsWith(item.route);
  }

  closeSidebar(): void {
    this.layoutService.closeSidebar();
  }

  onLogout(): void {
    this.closeSidebar();
    this.authService.logout();
  }
}
