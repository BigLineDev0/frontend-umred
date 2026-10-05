import {
  Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LayoutService } from '../../Core/services/layout.service';
import { AuthService } from '../../Core/services/auth.service';
import { NavItem, NavSection } from '../../Core/models/nav-item.model';
import { OrganisationService } from '../../Core/services/organisation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AvatarModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private organisationService = inject(OrganisationService);
  private router = inject(Router);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(event => {
        this.currentUrl.set(event.urlAfterRedirects);
        afterNextRender(() => this.afficherLienActif(), { injector: this.injector });
      });

    // Hauteur de la fenêtre ou contenu du menu (changement de rôle) modifiés :
    // les indicateurs de défilement sont recalculés.
    afterNextRender(() => {
      const el = this.nav()?.nativeElement;
      if (!el) return;
      const observateur = new ResizeObserver(() => this.majIndicateursDefilement());
      observateur.observe(el);
      if (el.firstElementChild) observateur.observe(el.firstElementChild);
      this.destroyRef.onDestroy(() => observateur.disconnect());
      this.afficherLienActif();
    });
  }

  user = this.authService.currentUser;

  // Logo de l'établissement s'il en a configuré un, sinon celui de la plateforme.
  logoPersonnalise = computed(() => !!this.organisationService.courante()?.logo);
  logo = computed(() => this.organisationService.courante()?.logo ?? 'images/logo-senlab-white.png');
  nomEtablissement = computed(() => this.organisationService.courante()?.nom ?? 'SenLab');

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

  private notificationsItem: NavItem = { label: 'Notifications', icon: 'pi pi-bell', route: '/notifications' };

  // Ressources du laboratoire, communes à tous les rôles d'un établissement.
  private ressourcesSection: NavSection = {
    titre: 'Ressources',
    items: [
      { label: 'Laboratoires', icon: 'pi pi-building', route: '/laboratoires' },
      { label: 'Équipements', icon: 'pi pi-cog', route: '/equipements' },
      { label: 'Consommables', icon: 'pi pi-box', route: '/consommables' },
    ],
  };

  // Liens regroupés par intention : le menu reste lisible même quand il est
  // long (administrateur), au lieu d'une liste plate d'une douzaine d'entrées.
  navSections = computed<NavSection[]>(() => {
    const role = this.user()?.role;

    switch (role) {
      case 'SUPER_ADMIN':
        return [{
          titre: 'Plateforme',
          items: [
            { label: 'Console plateforme', icon: 'pi pi-globe', route: '/plateforme', exact: true },
            this.notificationsItem,
          ],
        }];

      case 'ADMIN':
        return [
          {
            titre: 'Pilotage',
            items: [
              { label: 'Tableau de bord', icon: 'pi pi-th-large', route: '/admin/dashboard', exact: true },
              this.pilotageItem,
              { label: 'Rapports', icon: 'pi pi-chart-line', route: '/rapports' },
            ],
          },
          {
            titre: 'Activité',
            items: [
              this.reservationsAValiderItem,
              this.maintenancesItem,
              this.equipementsEnPanneItem,
              this.notificationsItem,
            ],
          },
          this.ressourcesSection,
          {
            titre: 'Administration',
            items: [
              { label: 'Utilisateurs', icon: 'pi pi-users', route: '/utilisateurs' },
              { label: "Journal d'activité", icon: 'pi pi-history', route: '/journal-activite' },
              { label: 'Mon établissement', icon: 'pi pi-sliders-h', route: '/etablissement' },
            ],
          },
        ];

      case 'TECHNICIEN':
        return [
          {
            titre: 'Pilotage',
            items: [
              { label: 'Tableau de bord', icon: 'pi pi-th-large', route: '/technicien/dashboard', exact: true },
              this.pilotageItem,
            ],
          },
          {
            titre: 'Activité',
            items: [
              this.maintenancesItem,
              this.reservationsAValiderItem,
              this.equipementsEnPanneItem,
              this.notificationsItem,
            ],
          },
          this.ressourcesSection,
        ];

      case 'CHERCHEUR':
        return [
          {
            titre: 'Mon espace',
            items: [
              { label: 'Tableau de bord', icon: 'pi pi-th-large', route: '/enseignant/dashboard', exact: true },
              {
                label: 'Mes réservations',
                icon: 'pi pi-file-edit',
                route: '/enseignant/reservations',
                activeRoutes: ['/reservations/ajouter'],
              },
              { ...this.reservationsAValiderItem, label: 'Demandes de mes étudiants' },
              this.notificationsItem,
            ],
          },
          this.ressourcesSection,
        ];

      case 'ETUDIANT':
        return [
          {
            titre: 'Mon espace',
            items: [
              { label: 'Tableau de bord', icon: 'pi pi-th-large', route: '/etudiant/dashboard', exact: true },
              {
                label: 'Mes demandes',
                icon: 'pi pi-file-edit',
                route: '/etudiant/mes-demandes',
                activeRoutes: ['/reservations/ajouter'],
              },
              this.notificationsItem,
            ],
          },
          this.ressourcesSection,
        ];

      default:
        return [];
    }
  });

  // --- Défilement du menu ---
  // La barre de défilement est masquée : à la place, un dégradé et un bouton
  // chevron signalent qu'il reste des liens au-dessus ou en dessous.
  private nav = viewChild<ElementRef<HTMLElement>>('nav');
  peutDefilerHaut = signal(false);
  peutDefilerBas = signal(false);

  majIndicateursDefilement(): void {
    const el = this.nav()?.nativeElement;
    if (!el) return;
    this.peutDefilerHaut.set(el.scrollTop > 4);
    this.peutDefilerBas.set(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }

  defiler(sens: 1 | -1): void {
    const el = this.nav()?.nativeElement;
    el?.scrollBy({ top: sens * el.clientHeight * 0.6, behavior: 'smooth' });
  }

  // Le lien actif peut se trouver hors de la zone visible (ex. « Mon
  // établissement » en bas d'un long menu) : on le ramène dans le champ.
  private afficherLienActif(): void {
    const el = this.nav()?.nativeElement;
    el?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }

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
