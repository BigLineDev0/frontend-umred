import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';

import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../../Core/services/equipement.service';
import {
  AlternativeCreneau, EquipementEquivalent, ReservationPayload, VerificationReservation,
} from '../../../../Core/models/reservation.model';
import { OrganisationService } from '../../../../Core/services/organisation.service';
import { MessageService } from 'primeng/api';
import { ReservationService } from '../../../../Core/services/reservation.service';
import { ProjetService } from '../../../../Core/services/projet.service';
import { ProjetFormModal } from '../../../../Shared/components/projet-form-modal/projet-form-modal';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { messageErreur } from '../../../../Shared/utils/message-erreur';

@Component({
  standalone: true,
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
  imports: [PageHeader, 
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    ProjetFormModal,
    DatePipe
  ],
})
export class ReservationForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  private readonly reservationService = inject(ReservationService);
  readonly projetService = inject(ProjetService);
  private readonly organisationService = inject(OrganisationService);
  private readonly messageService = inject(MessageService);

  // Analyse du serveur affichée dans le récapitulatif : conflits,
  // alternatives, statut que prendra la demande, place dans la file.
  readonly verification = signal<VerificationReservation | null>(null);
  readonly verificationEnCours = signal(false);
  readonly alerteCreee = signal(false);
  projetFormVisible = signal(false);

  // Règles de l'établissement (durée minimale, horaires d'ouverture).
  readonly regles = computed(() => {
    const org = this.organisationService.courante();
    return {
      dureeMin: org?.duree_min_reservation ?? 30,
      dureeMax: org?.duree_max_reservation ?? 480,
      ouverture: org?.heure_ouverture?.slice(0, 5) ?? '08:00',
      fermeture: org?.heure_fermeture?.slice(0, 5) ?? '19:00',
    };
  });

  readonly today = new Date();

  readonly reservationForm = this.fb.nonNullable.group({
    laboratoireId: [null as number | null, Validators.required],
    date: [this.today, Validators.required],
    heureDebut: ['', Validators.required],
    heureFin: ['', Validators.required],
    // Pas de Validators.required ici : une réservation peut ne concerner
    // que la salle, sans équipement précis (décision métier assumée).
    equipementIds: [[] as number[]],
    motif: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    projetId: [null as number | null],
  });

  // --- États UI ---
  readonly showConfirmation = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly laboratoires = computed(() => this.laboratoireService.laboratoires());

  readonly equipementsDuLaboratoire = computed(() =>
    this.equipementService.equipements().map((e) => ({
      ...e,
      disponible: e.statut === 'DISPONIBLE',
    })),
  );

  ngOnInit(): void {
    this.laboratoireService.charger();
    this.projetService.charger();
    this.preselectionner();
  }

  // Arrivée depuis « Réserver » (page laboratoire ou équipement) :
  // ?laboratoire=<id>[&equipement=<id>] préremplit le formulaire, pour ne
  // pas redemander ce que l'utilisateur vient de choisir.
  private preselectionner(): void {
    const params = this.route.snapshot.queryParamMap;
    const laboratoireId = Number(params.get('laboratoire'));
    if (!laboratoireId) return;
    this.reservationForm.patchValue({ laboratoireId });
    this.onLaboratoireChange(laboratoireId);
    const equipementId = Number(params.get('equipement'));
    if (equipementId) {
      this.reservationForm.patchValue({ equipementIds: [equipementId] });
    }
  }

  // --- Sélection du laboratoire ---

  onLaboratoireChange(laboratoireId: number | null): void {
    // On repart d'une sélection d'équipements vierge : les équipements du
    // labo précédent n'ont plus de sens une fois qu'on en change.
    this.reservationForm.patchValue({ equipementIds: [] });

    if (laboratoireId) {
      this.equipementService.chargerParLaboratoire(laboratoireId);
    } else {
      this.equipementService.vider();
    }
  }

  // --- Sélection des équipements ---

  isEquipementSelected(id: number): boolean {
    return (this.reservationForm.get('equipementIds')?.value ?? []).includes(id);
  }

  toggleEquipement(equipement: { id: number; disponible: boolean }): void {
    if (!equipement.disponible) return;

    const control = this.reservationForm.get('equipementIds');
    const selection: number[] = control?.value ?? [];

    control?.setValue(
      selection.includes(equipement.id)
        ? selection.filter((id) => id !== equipement.id)
        : [...selection, equipement.id],
    );
  }

  get selectedEquipementsCount(): number {
    return (this.reservationForm.get('equipementIds')?.value ?? []).length;
  }

  get motifLength(): number {
    return (this.reservationForm.get('motif')?.value ?? '').length;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reservationForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  // --- Soumission : validations locales, puis vérification serveur ---
  // Les contrôles locaux donnent un retour immédiat ; la disponibilité est
  // ensuite vérifiée par le serveur (seul à avoir le planning à jour) AVANT
  // l'ouverture du récapitulatif, qui affiche conflits et alternatives.

  onSubmit(): void {
    this.error.set(null);

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      this.error.set('Veuillez vérifier les informations saisies.');
      return;
    }

    if (!this.isHoraireValide()) {
      this.error.set("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    if (this.isReservationDansLePasse()) {
      this.error.set("La date ou l'horaire sélectionné est déjà passé.");
      return;
    }

    const erreurDuree = this.verifierDureeEtHoraires();
    if (erreurDuree) {
      this.error.set(erreurDuree);
      return;
    }

    this.lancerVerification();
  }

  // Durée minimale/maximale et heures d'ouverture, configurées par l'établissement.
  private verifierDureeEtHoraires(): string | null {
    const { heureDebut, heureFin } = this.reservationForm.getRawValue();
    const duree = this.enMinutes(heureFin) - this.enMinutes(heureDebut);
    const r = this.regles();
    if (duree < r.dureeMin) {
      return `Une réservation doit durer au moins ${r.dureeMin} minutes.`;
    }
    if (duree > r.dureeMax) {
      return `Une réservation ne peut pas dépasser ${Math.floor(r.dureeMax / 60)}h${String(r.dureeMax % 60).padStart(2, '0')}.`;
    }
    if (heureDebut < r.ouverture || heureFin > r.fermeture) {
      return `Les réservations sont possibles entre ${r.ouverture} et ${r.fermeture}.`;
    }
    return null;
  }

  private enMinutes(heure: string): number {
    const [h, m] = heure.split(':').map(Number);
    return h * 60 + m;
  }

  private lancerVerification(): void {
    this.verificationEnCours.set(true);
    this.alerteCreee.set(false);
    this.reservationService.verifier(this.construirePayload()).subscribe({
      next: (resultat) => {
        this.verificationEnCours.set(false);
        this.verification.set(resultat);
        this.showConfirmation.set(true);
      },
      error: (err) => {
        this.verificationEnCours.set(false);
        this.showConfirmation.set(false);
        this.error.set(this.extraireMessageErreur(err));
      },
    });
  }

  private construirePayload(): ReservationPayload {
    const value = this.reservationForm.getRawValue();
    return {
      laboratoire: value.laboratoireId!,
      equipements: value.equipementIds,
      date: this.formatDate(value.date!),
      heure_debut: value.heureDebut,
      heure_fin: value.heureFin,
      motif: value.motif.trim(),
      projet: value.projetId,
    };
  }

  private isHoraireValide(): boolean {
    const debut = this.reservationForm.get('heureDebut')?.value;
    const fin = this.reservationForm.get('heureFin')?.value;
    if (!debut || !fin) return false;

    const [hDebut, mDebut] = debut.split(':').map(Number);
    const [hFin, mFin] = fin.split(':').map(Number);
    return hFin * 60 + mFin > hDebut * 60 + mDebut;
  }

  private isReservationDansLePasse(): boolean {
    const date = this.reservationForm.get('date')?.value;
    const heureDebut = this.reservationForm.get('heureDebut')?.value;
    if (!date || !heureDebut) return false;

    const [heure, minute] = heureDebut.split(':').map(Number);
    const dateComplete = new Date(date);
    dateComplete.setHours(heure, minute, 0, 0);
    return dateComplete < new Date();
  }

  // --- Confirmation finale : appel API réel ---

  confirmerReservation(): void {
    const payload = this.construirePayload();
    this.loading.set(true);

    this.reservationService.creer(payload).subscribe({
      next: (reservation) => {
        this.loading.set(false);
        this.showConfirmation.set(false);
        // Le toast est affiché par la mise en page principale : il reste
        // visible après le retour à la page précédente.
        const quand = `le ${this.getFormattedDate()} (${this.getHoraire()})`;
        this.messageService.add(reservation.statut === 'VALIDEE'
          ? { severity: 'success', summary: 'Réservation confirmée', detail: `Votre réservation ${quand} est confirmée.`, life: 5000 }
          : { severity: 'info', summary: 'Demande envoyée', detail: `Votre demande ${quand} est en attente de validation. Vous serez notifié de la décision.`, life: 6000 });
        this.location.back();
      },
      error: (err) => {
        this.loading.set(false);
        // Quelqu'un a pris le créneau entre la vérification et la
        // confirmation : le récapitulatif affiche le conflit et ses alternatives.
        if (err.status === 409 && err.error?.conflit) {
          this.verification.set({
            disponible: false, conflits: err.error.conflits, alternatives: err.error.alternatives,
          });
        } else {
          this.showConfirmation.set(false);
          this.error.set(this.extraireMessageErreur(err));
        }
      },
    });
  }

  private extraireMessageErreur(err: unknown): string {
    return messageErreur(err, 'Une erreur est survenue lors de la création de la réservation.');
  }

  annulerConfirmation(): void {
    this.showConfirmation.set(false);
  }

  goBack(): void {
    this.location.back();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Récapitulatif affiché dans la modale ---

  getLaboratoireName(): string {
    const id = this.reservationForm.get('laboratoireId')?.value;
    return this.laboratoires().find((l) => l.id === id)?.nom ?? '';
  }

  getEquipementsNames(): string {
    const selection: number[] = this.reservationForm.get('equipementIds')?.value ?? [];
    if (selection.length === 0) return 'Aucun — salle uniquement';
    return this.equipementService
      .equipements()
      .filter((e) => selection.includes(e.id))
      .map((e) => e.nom)
      .join(', ');
  }

  getFormattedDate(): string {
    const date = this.reservationForm.get('date')?.value;
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  getHoraire(): string {
    const debut = this.reservationForm.get('heureDebut')?.value;
    const fin = this.reservationForm.get('heureFin')?.value;
    return `${debut} – ${fin}`;
  }

  // Choisir une alternative relance aussitôt la vérification : le
  // récapitulatif se met à jour sans que l'utilisateur ait à tout ressaisir.
  appliquerAlternative(alt: AlternativeCreneau): void {
    const [annee, mois, jour] = alt.date.split('-').map(Number);
    this.reservationForm.patchValue({
      date: new Date(annee, mois - 1, jour),
      heureDebut: alt.heure_debut,
      heureFin: alt.heure_fin,
    });
    this.lancerVerification();
  }

  // Remplace uniquement l'équipement en conflit ; le reste de la sélection est conservé.
  appliquerEquipementEquivalent(equiv: EquipementEquivalent): void {
    const selection = this.reservationForm.getRawValue().equipementIds;
    this.reservationForm.patchValue({
      equipementIds: selection.map((id) => (id === equiv.remplace ? equiv.id : id)),
    });
    if (!this.equipementService.equipements().some((e) => e.id === equiv.id)) {
      const labo = this.reservationForm.getRawValue().laboratoireId;
      if (labo) this.equipementService.chargerParLaboratoire(labo);
    }
    this.lancerVerification();
  }

  // Liste d'attente : l'utilisateur sera notifié si le créneau se libère.
  alerterSiLibere(): void {
    const p = this.construirePayload();
    this.reservationService.creerAlerte({
      laboratoire: p.laboratoire, equipements: p.equipements,
      date: p.date, heure_debut: p.heure_debut, heure_fin: p.heure_fin,
    }).subscribe({
      next: () => this.alerteCreee.set(true),
      error: (err) => this.error.set(this.extraireMessageErreur(err)),
    });
  }

  onProjetCree(projetId: number): void {
    this.reservationForm.patchValue({ projetId });
  }
}
