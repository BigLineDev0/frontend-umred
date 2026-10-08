import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { Laboratoire, PHOTO_LABORATOIRE_DEFAUT, StatutLaboratoire } from '../../../../Core/models/laboratoire.model';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { ReservationService } from '../../../../Core/services/reservation.service';
import { DatePipe } from '@angular/common';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { ImageRepliDirective } from '../../../../Shared/directives/image-repli.directive';
import { AuthService } from '../../../../Core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-laboratoire-detail',
  templateUrl: './laboratoire-detail.html',
  styleUrl: './laboratoire-detail.css',
  imports: [PageHeader, RouterLink, ButtonModule, TagModule, DatePipe, ImageRepliDirective],
})
export class LaboratoireDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);

  readonly photoDefaut = PHOTO_LABORATOIRE_DEFAUT;
  // Mêmes rôles que le garde de la route /equipements/ajouter.
  readonly peutAjouterEquipement = computed(() =>
    ['ADMIN', 'TECHNICIEN'].includes(this.authService.currentUser()?.role ?? ''));

  laboratoire = signal<Laboratoire | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly equipementsAffiches = computed(() =>
    this.equipementService.equipements().map(e => ({
      ...e,
      statutLabel: this.getEquipementStatusLabel(e.statut),
      statutSeverity: this.getEquipementStatusSeverity(e.statut),
    }))
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.laboratoireService.chargerUn(id).subscribe({
      next: (labo) => {
        this.laboratoire.set(labo);
        this.loading.set(false);
        this.equipementService.chargerParLaboratoire(id);
        this.reservationService.charger({ laboratoire: id, aVenir: true });
      },
      error: () => {
        this.error.set('Le laboratoire demandé est introuvable.');
        this.loading.set(false);
      },
    });
  }

  getStatusLabel(status: StatutLaboratoire): string {
    return status === 'DISPONIBLE' ? 'Disponible' : 'Indisponible';
  }

  getStatusSeverity(status: StatutLaboratoire) {
    return status === 'DISPONIBLE' ? 'success' : 'secondary';
  }

  getEquipementStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      DISPONIBLE: 'Disponible', RESERVE: 'Réservé', EN_MAINTENANCE: 'En maintenance',
      EN_PANNE: 'En panne', HORS_SERVICE: 'Hors service',
    };
    return labels[status] ?? status;
  }

  getEquipementStatusSeverity(status: string) {
    const severity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      DISPONIBLE: 'success', RESERVE: 'info', EN_MAINTENANCE: 'warn',
      EN_PANNE: 'danger', HORS_SERVICE: 'secondary',
    };
    return severity[status] ?? 'secondary';
  }

  getReservationStatusLabel(statut: string): string {
    const labels: Record<string, string> = { EN_ATTENTE: 'En attente', VALIDEE: 'Validée', TERMINEE: 'Terminée' };
    return labels[statut] ?? statut;
  }

  getReservationStatusSeverity(statut: string) {
    const severity: Record<string, 'warn' | 'info' | 'success'> = { EN_ATTENTE: 'warn', VALIDEE: 'info', TERMINEE: 'success' };
    return severity[statut] ?? 'info';
  }

  getEquipementIcon(): string {
    return 'pi pi-cog';
  }

  reserver(): void {
    const labo = this.laboratoire();
    if (!labo) return;
    this.router.navigate(['/reservations/ajouter'], { queryParams: { laboratoire: labo.id } });
  }

  modifier(): void {
    const labo = this.laboratoire();
    if (!labo) return;
    this.router.navigate(['/laboratoires', labo.id, 'modifier']);
  }
}
