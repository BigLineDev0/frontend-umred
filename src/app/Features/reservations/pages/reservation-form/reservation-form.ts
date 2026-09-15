import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';

import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { ReservationPayload } from '../../../../Core/models/reservation.model';
import { ReservationService } from '../../../../Core/services/reservation.service';

@Component({
  standalone: true,
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
  ],
})
export class ReservationForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly laboratoireService = inject(LaboratoireService);
  readonly equipementService = inject(EquipementService);
  private readonly reservationService = inject(ReservationService);

  readonly today = new Date();

  readonly reservationForm = this.fb.nonNullable.group({
    laboratoireId: [null as number | null, Validators.required],
    date: [this.today, Validators.required],
    heureDebut: ['', Validators.required],
    heureFin: ['', Validators.required],
    // Pas de Validators.required ici : une réservation peut ne concerner
    // que la salle, sans équipement précis (décision métier assumée).
    equipementIds: [[] as number[]],
    motif: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
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

  // --- Soumission : validations locales, puis ouverture du récapitulatif ---
  // La vraie vérification de disponibilité (chevauchement de créneau) n'a
  // lieu qu'à la confirmation, côté serveur — c'est lui qui a la donnée à
  // jour, un contrôle uniquement local pourrait mentir entre deux instants.

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

    this.showConfirmation.set(true);
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
    const value = this.reservationForm.getRawValue();

    const payload: ReservationPayload = {
      laboratoire: value.laboratoireId!,
      equipements: value.equipementIds,
      date: this.formatDate(value.date!),
      heure_debut: value.heureDebut,
      heure_fin: value.heureFin,
      motif: value.motif.trim(),
    };

    this.loading.set(true);

    this.reservationService.creer(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.showConfirmation.set(false);
        this.location.back();
      },
      error: (err) => {
        this.loading.set(false);
        this.showConfirmation.set(false);
        this.error.set(this.extraireMessageErreur(err));
      },
    });
  }

  // DRF renvoie soit un tableau de messages (nos ValidationError métier,
  // ex. le conflit de créneau), soit un objet {champ: [messages]} pour les
  // erreurs de validation de champ classiques.
  private extraireMessageErreur(err: any): string {
    const body = err.error;
    if (Array.isArray(body)) return body[0];
    if (body?.detail) return body.detail;
    if (typeof body === 'object') {
      const premierChamp = Object.values(body)[0];
      if (Array.isArray(premierChamp)) return premierChamp[0] as string;
    }
    return 'Une erreur est survenue lors de la création de la réservation.';
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
}
