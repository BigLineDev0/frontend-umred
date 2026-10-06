import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DemandeEnAttente, Recommandation, Reservation } from '../../../../Core/models/reservation.model';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { AuthService } from '../../../../Core/services/auth.service';

import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../../Shared/components/mini-stat-card/mini-stat-card';
import { FilterBar } from '../../../../Shared/components/filter-bar/filter-bar';
import { DataTable, TableColumn } from '../../../../Shared/components/data-table/data-table';
import { ColumnTemplateDirective } from '../../../../Shared/components/column-template.directive';
import { StatusBadge } from '../../../../Shared/components/status-badge';
import { RowActions } from '../../../../Shared/components/row-actions';
import { ReservationDetailModal } from '../../components/reservation-detail-modal/reservation-detail-modal';
import { ReservationService } from '../../../../Core/services/reservation.service';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

interface FilterValues {
  search: string;
  status: Reservation['statut'] | null;
  laboratoire: number | null;
  // Nom du validateur, ou AUTOMATIQUE pour les décisions prises par les règles.
  traitePar: string | null;
}

type Onglet = 'file' | 'traitees' | 'archives';

const AUTOMATIQUE = '__auto__';

@Component({
  selector: 'app-reservations-a-valider',
  standalone: true,
  templateUrl: './reservations-a-valider.html',
  providers: [ConfirmationService],
  imports: [
    DatePipe,
    FormsModule,
    SelectModule,
    DialogModule,
    TextareaModule,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    PageHeader,
    MiniStatCard,
    FilterBar,
    DataTable,
    ColumnTemplateDirective,
    StatusBadge,
    RowActions,
    ReservationDetailModal,
  ],
})
export class ReservationsAValider implements OnInit {
  readonly reservationService = inject(ReservationService);
  readonly laboratoireService = inject(LaboratoireService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  readonly reservations = this.reservationService.reservations;
  readonly loading = this.reservationService.loading;
  readonly error = this.reservationService.error;

  // L'admin voit toutes les réservations de l'établissement et gère les
  // archives ; technicien et enseignant-chercheur voient la file des
  // demandes qu'ils peuvent traiter et l'historique de LEURS décisions.
  // Le serveur applique les mêmes règles : ce n'est pas qu'un affichage.
  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  readonly isEncadrant = computed(() => this.authService.currentUser()?.role === 'CHERCHEUR');

  readonly onglet = signal<Onglet>('file');
  readonly onglets = computed(() => [
    { id: 'file' as Onglet, label: 'À traiter', icon: 'pi pi-inbox', compteur: this.file().length },
    { id: 'traitees' as Onglet, label: this.isAdmin() ? 'Toutes les réservations' : 'Traitées par moi', icon: 'pi pi-history' },
    ...(this.isAdmin() ? [{ id: 'archives' as Onglet, label: 'Archives', icon: 'pi pi-box' }] : []),
  ]);

  // File d'attente analysée par le serveur (priorité, concurrence, recommandation).
  readonly file = signal<DemandeEnAttente[]>([]);
  readonly fileLoading = signal(false);
  readonly actionEnCours = signal<number | null>(null);

  // Refus motivé
  readonly refusCible = signal<Reservation | null>(null);
  motifRefus = '';

  readonly recommandationLibelle: Record<Recommandation, string> = {
    valider: 'Recommandé : valider',
    refuser: 'Recommandé : refuser',
    arbitrer: 'À arbitrer',
  };

  readonly filters = signal<FilterValues>({ search: '', status: null, laboratoire: null, traitePar: null });

  readonly columns = computed<TableColumn<Reservation>[]>(() => [
    { field: 'demandeur_nom', header: 'Demandeur' },
    { field: 'laboratoire_nom', header: 'Laboratoire' },
    { field: 'equipements_noms', header: 'Équipement(s)' },
    { field: 'date', header: 'Date' },
    { field: 'creneau', header: 'Horaire' },
    { field: 'statut', header: 'Statut' },
    this.onglet() === 'archives'
      ? { field: 'archivage', header: 'Archivée par' }
      : { field: 'traitement', header: 'Traitée par' },
    { field: 'actions', header: 'Actions', width: '150px' },
  ]);

  readonly statusOptions = [
    { label: 'Tous les statuts', value: null },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'Validée', value: 'VALIDEE' },
    { label: 'Refusée', value: 'REFUSEE' },
    { label: 'Annulée', value: 'ANNULEE' },
    { label: 'Terminée', value: 'TERMINEE' },
  ];

  readonly laboratoireOptions = computed(() => [
    { label: 'Tous les laboratoires', value: null },
    ...this.laboratoireService.laboratoires().map((l) => ({ label: l.nom, value: l.id })),
  ]);

  // Filtre d'audit « Traitée par » (admin) : construit à partir des données.
  readonly traiteParOptions = computed(() => {
    const noms = [...new Set(this.reservations().map((r) => r.validateur_nom).filter((n): n is string => !!n))].sort();
    return [
      { label: 'Tous les validateurs', value: null },
      { label: 'Décision automatique', value: AUTOMATIQUE },
      ...noms.map((n) => ({ label: n, value: n })),
    ];
  });

  readonly filteredReservations = computed(() => this.filtrer(this.reservations()));
  readonly stats = computed(() => {
    const liste = this.reservations();
    const compter = (s: Reservation['statut']) => liste.filter((r) => r.statut === s).length;
    return {
      total: liste.length,
      enAttente: compter('EN_ATTENTE'),
      validees: compter('VALIDEE') + compter('TERMINEE'),
      refusees: compter('REFUSEE'),
    };
  });

  detailModalVisible = signal(false);
  reservationSelectionnee = signal<Reservation | null>(null);

  ngOnInit(): void {
    this.chargerFile();
    this.laboratoireService.charger();
  }

  changerOnglet(onglet: Onglet): void {
    if (onglet === this.onglet()) return;
    this.onglet.set(onglet);
    this.filters.set({ search: '', status: null, laboratoire: null, traitePar: null });
    if (onglet === 'file') this.chargerFile();
    else this.chargerListe();
  }

  // Le périmètre est décidé par le serveur : ?all=true est refusé à un
  // non-admin, ?traitees=true ne renvoie que les décisions de l'utilisateur.
  chargerListe(): void {
    if (this.onglet() === 'archives') {
      this.reservationService.charger({ all: true, archivees: 'only' });
    } else if (this.isAdmin()) {
      this.reservationService.charger({ all: true });
    } else {
      this.reservationService.charger({ traitees: true });
    }
  }

  chargerFile(): void {
    this.fileLoading.set(true);
    this.reservationService.fileAttente().subscribe({
      next: (demandes) => { this.file.set(demandes); this.fileLoading.set(false); },
      error: () => this.fileLoading.set(false),
    });
  }

  // Après une décision, la file et l'historique sont rechargés : valider une
  // demande peut refuser automatiquement ses concurrentes.
  private apresDecision(titre: string, detail: string): void {
    this.actionEnCours.set(null);
    this.messageService.add({ severity: 'success', summary: titre, detail });
    this.chargerFile();
    if (this.onglet() !== 'file') this.chargerListe();
  }

  private enErreur(err: unknown): void {
    this.actionEnCours.set(null);
    this.messageService.add({
      severity: 'error', summary: 'Action impossible', detail: messageErreur(err, "L'action n'a pas pu être effectuée."),
    });
  }

  setFilter<K extends keyof FilterValues>(key: K, value: FilterValues[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  private filtrer(reservations: Reservation[]): Reservation[] {
    const { search, status, laboratoire, traitePar } = this.filters();
    const searchLower = search.toLowerCase().trim();

    return reservations.filter(
      (r) =>
        (!searchLower ||
          r.demandeur_nom.toLowerCase().includes(searchLower) ||
          r.laboratoire_nom.toLowerCase().includes(searchLower) ||
          (r.validateur_nom ?? '').toLowerCase().includes(searchLower) ||
          (r.motif ?? '').toLowerCase().includes(searchLower)) &&
        (!status || r.statut === status) &&
        (!laboratoire || r.laboratoire === laboratoire) &&
        (!traitePar || (traitePar === AUTOMATIQUE ? !!r.decision_automatique : r.validateur_nom === traitePar)),
    );
  }

  voir(reservation: Reservation): void {
    this.reservationSelectionnee.set(reservation);
    this.detailModalVisible.set(true);
  }

  valider(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Valider la demande de ${reservation.demandeur_nom} ?`,
      header: 'Confirmer la validation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, valider',
      rejectLabel: 'Retour',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.actionEnCours.set(reservation.id);
        this.reservationService.valider(reservation.id).subscribe({
          next: () => this.apresDecision('Demande validée',
            'Les demandes concurrentes éventuelles ont été refusées et prévenues avec des alternatives.'),
          error: (err) => this.enErreur(err),
        });
      },
    });
  }

  refuser(reservation: Reservation): void {
    this.motifRefus = '';
    this.refusCible.set(reservation);
  }

  confirmerRefus(): void {
    const cible = this.refusCible();
    if (!cible) return;
    this.actionEnCours.set(cible.id);
    this.reservationService.refuser(cible.id, this.motifRefus.trim()).subscribe({
      next: () => {
        this.refusCible.set(null);
        this.apresDecision('Demande refusée', 'Le demandeur a été notifié du motif.');
      },
      error: (err) => this.enErreur(err),
    });
  }

  archiver(reservation: Reservation): void {
    this.confirmationService.confirm({
      message: `Archiver la réservation de ${reservation.demandeur_nom} ? Elle quittera la liste et restera consultable dans l'onglet Archives.`,
      header: "Confirmer l'archivage",
      icon: 'pi pi-box',
      acceptLabel: 'Oui, archiver',
      rejectLabel: 'Retour',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.reservationService.archiver(reservation.id).subscribe({
        next: () => this.messageService.add({
          severity: 'success', summary: 'Réservation archivée', detail: "Elle est désormais dans l'onglet Archives.",
        }),
        error: (err) => this.enErreur(err),
      }),
    });
  }

  desarchiver(reservation: Reservation): void {
    this.reservationService.desarchiver(reservation.id).subscribe({
      next: () => this.messageService.add({
        severity: 'success', summary: 'Réservation restaurée', detail: 'Elle est de retour dans la liste des réservations.',
      }),
      error: (err) => this.enErreur(err),
    });
  }
}
