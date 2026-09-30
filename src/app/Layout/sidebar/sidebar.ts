import { Component, computed, inject, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { LayoutService } from '../../Core/services/layout.service';
import { AuthService } from '../../Core/services/auth.service';
import { NavItem } from '../../Core/models/nav-item.model';
import { OrganisationService } from '../../Core/services/organisation.service';

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
  private organisationService = inject(OrganisationService);
  private router = inject(Router);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }

  user = this.authService.currentUser;

  // Logo de l'établissement s'il en a configuré un, sinon celui de la plateforme.
  logo = computed(() => this.organisationService.courante()?.logo ?? 'images/logo_umred.png');
  nomEtablissement = computed(() => this.organisationService.courante()?.nom ?? 'UMRED');

  initials = computed(() => {
    const u = this.user();
    return u ? `${u.prenom[0]}${u.nom[0]}`.toUpperCase() : '';
  });

  roleLabel = computed(() => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Éditeur de la plateforme',
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
    { label: 'Consommables', icon: 'pi pi-box', route: '/consommables' },
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

  private pilotageItem: NavItem = {
    label: 'Aide à la décision', icon: 'pi pi-sparkles', route: '/pilotage',
  };

  private reservationsAValiderItem: NavItem = {
    label: 'Réservations à valider',
    icon: 'pi pi-check-square',
    route: '/reservations/a-valider',
    activeRoutes: ['/reservations/a-valider'],
  };

  navItems = computed<NavItem[]>(() => {
    const role = this.user()?.role;

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Console plateforme', icon: 'pi pi-globe', route: '/plateforme', exact: true },
          { label: 'Notifications', icon: 'pi pi-bell', route: '/notifications' },
        ];

      case 'ADMIN':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/admin/dashboard', exact: true },
          this.pilotageItem,
          this.reservationsAValiderItem,
          ...this.commonItems,
          this.equipementsEnPanneItem,
          this.maintenancesItem,
          { label: 'Utilisateurs', icon: 'pi pi-users', route: '/utilisateurs' },
          { label: 'Rapports', icon: 'pi pi-chart-line', route: '/rapports' },
          { label: "Journal d'activité", icon: 'pi pi-history', route: '/journal-activite' },
          { label: 'Mon établissement', icon: 'pi pi-sliders-h', route: '/etablissement' },
        ];

      case 'TECHNICIEN':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/technicien/dashboard', exact: true },
          this.pilotageItem,
          this.maintenancesItem,
          this.reservationsAValiderItem,
          ...this.commonItems,
          this.equipementsEnPanneItem,
        ];

      case 'CHERCHEUR':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/enseignant/dashboard', exact: true },
          {
            label: 'Mes réservations',
            icon: 'pi pi-file-edit',
            route: '/enseignant/reservations',
            activeRoutes: ['/reservations/ajouter'],
          },
          { ...this.reservationsAValiderItem, label: 'Demandes de mes étudiants' },
          ...this.commonItems,
        ];

      case 'ETUDIANT':
        return [
          { label: 'Tableau de bord', icon: 'pi pi-table', route: '/etudiant/dashboard', exact: true },
          {
            label: 'Mes demandes',
            icon: 'pi pi-file-edit',
            route: '/etudiant/mes-demandes',
            activeRoutes: ['/reservations/ajouter'],
          },
          ...this.commonItems,
        ];

      default:
        return [];
    }
  });

  isItemActive(item: NavItem): boolean {
    const url = this.normalizeUrl(this.currentUrl());

    if (item.excludes?.some(exclu => this.matchesRoute(url, exclu))) {
      return false;
    }

    const activeRoutes = [item.route, ...(item.activeRoutes ?? [])];
    return item.exact
      ? activeRoutes.some(route => url === this.normalizeUrl(route))
      : activeRoutes.some(route => this.matchesRoute(url, route));
  }

  private matchesRoute(url: string, route: string): boolean {
    const normalizedRoute = this.normalizeUrl(route);
    return url === normalizedRoute || url.startsWith(`${normalizedRoute}/`);
  }

  private normalizeUrl(url: string): string {
    const path = url.split(/[?#]/, 1)[0];
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }

  closeSidebar(): void {
    this.layoutService.closeSidebar();
  }

  onLogout(): void {
    this.closeSidebar();
    this.authService.logout();
  }
}
