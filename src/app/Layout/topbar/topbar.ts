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
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';

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
  resultats = signal<ResultatRecherche>({ equipements: [], laboratoires: [] });
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
        switchMap((terme) => (terme.length >= 2 ? this.rechercheService.rechercher(terme) : [])),
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

  // Pas de page de détail dédiée pour une réservation (on la consulte via
  // modale depuis sa liste) — on redirige vers la liste pertinente selon
  // le rôle, où l'utilisateur retrouve l'élément concerné.
  private naviguerVersEntite(n: Notification): void {
    if (n.entite_type_nom === 'maintenance' && n.entite_id) {
      this.router.navigate(['/maintenances', n.entite_id]);
      return;
    }
    if (n.entite_type_nom === 'reservation') {
      const role = this.user()?.role;
      const route =
        role === 'ETUDIANT'
          ? '/etudiant/dashboard/mes-demandes'
          : role === 'CHERCHEUR'
            ? '/enseignant/dashboard/reservations'
            : '/reservations/a-valider';
      this.router.navigate([route]);
      return;
    }
    this.router.navigate(['/notifications']);
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
