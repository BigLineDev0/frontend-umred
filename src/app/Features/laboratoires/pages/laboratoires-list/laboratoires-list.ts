import { Component, ElementRef, computed, effect, inject, signal, untracked, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';

import { Laboratoire, PHOTO_LABORATOIRE_DEFAUT, StatutLaboratoire } from '../../../../Core/models/laboratoire.model';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { ImageRepliDirective } from '../../../../Shared/directives/image-repli.directive';

@Component({
  standalone: true,
  selector: 'app-laboratoires-list',
  templateUrl: './laboratoires-list.html',
  styleUrl: './laboratoires-list.css',
  imports: [PageHeader, FilterBar, ImageRepliDirective,
    RouterLink, FormsModule, ButtonModule, TagModule, InputTextModule,
    SelectModule, IconFieldModule, InputIconModule, TooltipModule, ConfirmDialogModule, PaginatorModule,
  ],
  providers: [ConfirmationService],
})
export class LaboratoiresList implements OnInit {
  private readonly laboratoireService = inject(LaboratoireService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly hote = inject(ElementRef<HTMLElement>);

  readonly laboratoires = this.laboratoireService.laboratoires;
  readonly loading = this.laboratoireService.loading;
  readonly error = this.laboratoireService.error;

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  readonly photoDefaut = PHOTO_LABORATOIRE_DEFAUT;

  search = signal('');
  selectedStatus = signal<StatutLaboratoire | null>(null);

  readonly statusOptions = [
    { label: 'Tous', value: null },
    { label: 'Disponibles', value: 'DISPONIBLE' },
    { label: 'Indisponibles', value: 'INDISPONIBLE' },
  ];

  readonly filteredLaboratoires = computed(() => {
    const search = this.search().toLowerCase().trim();
    const status = this.selectedStatus();

    return this.laboratoires().filter((l) =>
      (!search || l.nom.toLowerCase().includes(search) || l.localisation.toLowerCase().includes(search)) &&
      (!status || l.statut === status)
    );
  });

  // Pagination côté client : 6 cartes par page (2 rangées de 3 sur grand
  // écran, 3 de 2 sur tablette).
  readonly parPageOptions = [6, 12, 24];
  readonly premier = signal(0);
  readonly parPage = signal(6);

  readonly laboratoiresPage = computed(() =>
    this.filteredLaboratoires().slice(this.premier(), this.premier() + this.parPage()));

  // « 7–12 sur 14 laboratoires »
  readonly resumePage = computed(() => {
    const total = this.filteredLaboratoires().length;
    const fin = Math.min(this.premier() + this.parPage(), total);
    return `${this.premier() + 1}–${fin} sur ${total} laboratoire${total > 1 ? 's' : ''}`;
  });

  constructor() {
    // Nouvelle recherche ou nouveau filtre : retour à la première page.
    effect(() => {
      this.search();
      this.selectedStatus();
      untracked(() => this.premier.set(0));
    });
    // Liste réduite (suppression) : ne jamais rester sur une page vide.
    effect(() => {
      const total = this.filteredLaboratoires().length;
      untracked(() => {
        if (this.premier() >= total && total > 0) {
          this.premier.set(Math.floor((total - 1) / this.parPage()) * this.parPage());
        }
      });
    });
  }

  changerPage(evenement: PaginatorState): void {
    this.parPage.set(evenement.rows ?? this.parPage());
    this.premier.set(evenement.first ?? 0);
    // La page défile dans le <main> de la mise en page, pas dans window :
    // on ramène le haut de la liste dans la vue, quel que soit le conteneur.
    this.hote.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnInit(): void {
    this.laboratoireService.charger();
  }

  getStatusLabel(status: StatutLaboratoire): string {
    return status === 'DISPONIBLE' ? 'Disponible' : 'Indisponible';
  }

  getStatusSeverity(status: StatutLaboratoire) {
    return status === 'DISPONIBLE' ? 'success' : 'secondary';
  }

  voirLaboratoire(laboratoire: Laboratoire): void {
    this.router.navigate(['/laboratoires', laboratoire.id]);
  }

  reserverLaboratoire(laboratoire: Laboratoire): void {
    if (laboratoire.statut === 'INDISPONIBLE') return;
    this.router.navigate(['/reservations/ajouter'], {
      queryParams: { laboratoire: laboratoire.id },
    });
  }

  modifierLaboratoire(laboratoire: Laboratoire): void {
    this.router.navigate(['/laboratoires', laboratoire.id, 'modifier']);
  }

  supprimerLaboratoire(laboratoire: Laboratoire): void {
    this.confirmationService.confirm({
      header: 'Supprimer le laboratoire',
      message: `Êtes-vous sûr de vouloir supprimer « ${laboratoire.nom} » ? Cette action est irréversible.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.laboratoireService.supprimer(laboratoire.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Laboratoire supprimé',
              detail: `« ${laboratoire.nom} » a été supprimé avec succès.`,
            });
          },
          error: (err) => this.laboratoireService.error.set(
            err.error?.detail ?? 'Suppression impossible.'
          ),
        });
      },
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.selectedStatus.set(null);
  }
}
