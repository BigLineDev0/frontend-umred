import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { LayoutService } from '../../Core/services/layout.service';
import { AuthService } from '../../Core/services/auth.service';
import { NotificationService } from '../../Core/services/notification.service';
import { Notification, TypeNotification } from '../../Core/models/notification.model';
import { RechercheService } from '../../Core/services/recherche.service';
import { ResultatRecherche } from '../../Core/models/recherche.model';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { routeNotification } from '../../Shared/utils/notification-route';

const RESULTAT_VIDE: ResultatRecherche = { equipements: [], laboratoires: [] };

const NOTIF_STYLE: Record<TypeNotification, { icon: string; bg: string; color: string }> = {
  RESERVATION: { icon: 'pi pi-calendar', bg: 'bg-primary/10', color: 'text-primary' },
  MAINTENANCE: { icon: 'pi pi-wrench', bg: 'bg-accent/10', color: 'text-accent' },
  VALIDATION: { icon: 'pi pi-check-circle', bg: 'bg-success/10', color: 'text-success' },
  RAPPEL: { icon: 'pi pi-clock', bg: 'bg-accent/10', color: 'text-accent' },
  SYSTEME: { icon: 'pi pi-info-circle', bg: 'bg-primary/10', color: 'text-primary' },
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
    FormsModule
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  profileMenuOpen = signal(false);
  notifPanelOpen = signal(false);

  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly notificationService = inject(NotificationService);

  private rechercheService = inject(RechercheService);

  rechercheTerme = signal('');
  rechercheOuverte = signal(false);
  resultats = signal<ResultatRecherche>(RESULTAT_VIDE);
  private rechercheSubject = new Subject<string>();

  onRechercheInput(valeur: string): void {
    this.rechercheTerme.set(valeur);
    this.rechercheOuverte.set(valeur.length >= 2);
    this.rechercheSubject.next(valeur);
  }

  fermerRecherche(): void {
    this.rechercheOuverte.set(false);
  }

  user = this.authService.currentUser;

  initials = computed(() => {
    const u = this.user();
    return u ? `${u.prenom[0]}${u.nom[0]}`.toUpperCase() : '';
  });

  constructor(private elementRef: ElementRef) {
    effect(() => {
      if (this.notifPanelOpen()) this.notificationService.chargerRecentes();
    });

    // debounceTime évite de lancer une requête à CHAQUE frappe — on
    // attend que l'utilisateur marque une pause de 300ms avant de
    // chercher. distinctUntilChanged évite de relancer la même requête
    // si le texte n'a en fait pas changé (ex: retaper la même lettre).
    this.rechercheSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // catchError DANS le switchMap : une requête en échec ne doit pas
        // terminer le flux, sinon la recherche cessait de fonctionner
        // jusqu'au rechargement de la page.
        switchMap((terme) => (terme.length >= 2
          ? this.rechercheService.rechercher(terme).pipe(catchError(() => of(RESULTAT_VIDE)))
          : [])),
      )
      .subscribe((resultat) => {
        if (resultat) this.resultats.set(resultat);
      });
  }

  styleFor(type: TypeNotification) {
    return NOTIF_STYLE[type];
  }

  toggleProfileMenu(): void {
    this.notifPanelOpen.set(false);
    this.profileMenuOpen.update((o) => !o);
  }
  toggleNotifPanel(): void {
    this.profileMenuOpen.set(false);
    this.notifPanelOpen.update((o) => !o);
  }

  marquerToutesLues(): void {
    this.notificationService.marquerToutesLues().subscribe();
  }

  ouvrirNotification(n: Notification): void {
    if (!n.lu) this.notificationService.marquerLue(n.id).subscribe();
    this.notifPanelOpen.set(false);
    this.naviguerVersEntite(n);
  }

  private naviguerVersEntite(n: Notification): void {
    const cible = routeNotification(n, this.user()?.role);
    this.router.navigate(Array.isArray(cible) ? cible : [cible]);
  }

  tempsEcoule(dateIso: string): string {
    const minutes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures} h`;
    return `Il y a ${Math.floor(heures / 24)} j`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.profileMenuOpen.set(false);
      this.notifPanelOpen.set(false);
      this.rechercheOuverte.set(false);
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
