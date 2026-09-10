import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';

import { CreateReservationRequest } from '../../models/reservation.model';

interface LaboratoireOption {
  id: number;
  nom: string;
}

interface EquipementOption {
  id: number;
  nom: string;
  reference: string;
  disponible: boolean;
}

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
  private readonly fb = new FormBuilder();

  // ---------------------------------------------------------
  // Date du jour
  // ---------------------------------------------------------

  readonly today = new Date();

  // ---------------------------------------------------------
  // Formulaire
  // ---------------------------------------------------------

  reservationForm: FormGroup = this.fb.group({
    laboratoireId: [null, Validators.required],

    date: [this.today, Validators.required],

    heureDebut: ['', Validators.required],

    heureFin: ['', Validators.required],

    equipementIds: [[], [Validators.required, Validators.minLength(1)]],

    motif: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
  });

  // ---------------------------------------------------------
  // États UI
  // ---------------------------------------------------------

  showConfirmation = signal(false);

  loading = signal(false);

  checkingAvailability = signal(false);

  error = signal<string | null>(null);

  // Résultat de la vérification de disponibilité
  availabilityMessage = signal<string | null>(null);

  availabilitySuccess = signal(false);

  // ---------------------------------------------------------
  // Données mockées
  // ---------------------------------------------------------

  laboratoires: LaboratoireOption[] = [
    {
      id: 1,
      nom: 'Laboratoire de Biochimie',
    },
    {
      id: 2,
      nom: 'Laboratoire de Microbiologie',
    },
    {
      id: 3,
      nom: 'Laboratoire de Biologie Moléculaire',
    },
    {
      id: 4,
      nom: 'Laboratoire de Physique',
    },
    {
      id: 5,
      nom: 'Laboratoire de Chimie Organique',
    },
  ];

  equipements: EquipementOption[] = [
    {
      id: 1,
      nom: 'Spectrophotomètre',
      reference: 'SP-2024-001',
      disponible: true,
    },
    {
      id: 2,
      nom: 'Microscope',
      reference: 'MI-2024-014',
      disponible: true,
    },
    {
      id: 3,
      nom: 'Centrifugeuse',
      reference: 'CF-2024-003',
      disponible: true,
    },
    {
      id: 4,
      nom: 'PCR',
      reference: 'PC-2024-007',
      disponible: false,
    },
  ];

  // ---------------------------------------------------------
  // Équipements affichés
  // ---------------------------------------------------------

  selectedLaboratoireId = signal<number | null>(null);

  equipementsDuLaboratoire = computed(() => {
    /*
     * Pour le moment, les équipements sont mockés.
     *
     * Plus tard :
     * this.equipementService.getByLaboratoire(...)
     */

    return this.equipements;
  });

  // ---------------------------------------------------------
  // Résumé
  // ---------------------------------------------------------

  resume = signal<CreateReservationRequest | null>(null);

  // ---------------------------------------------------------
  // Changement de laboratoire
  // ---------------------------------------------------------

  onLaboratoireChange(laboratoireId: number | null): void {
    this.selectedLaboratoireId.set(laboratoireId);

    // Réinitialiser les équipements
    // lorsqu'on change de laboratoire.
    this.reservationForm.patchValue({
      equipementIds: [],
    });

    this.clearAvailability();
  }

  // ---------------------------------------------------------
  // Sélection équipement
  // ---------------------------------------------------------

  isEquipementSelected(equipementId: number): boolean {
    const selectedIds = this.reservationForm.get('equipementIds')?.value ?? [];

    return selectedIds.includes(equipementId);
  }

  toggleEquipement(equipement: EquipementOption): void {
    if (!equipement.disponible) {
      return;
    }

    const control = this.reservationForm.get('equipementIds');

    const selectedIds: number[] = control?.value ?? [];

    if (selectedIds.includes(equipement.id)) {
      control?.setValue(selectedIds.filter((id) => id !== equipement.id));
    } else {
      control?.setValue([...selectedIds, equipement.id]);
    }

    control?.markAsTouched();

    this.clearAvailability();
  }

  // ---------------------------------------------------------
  // Nombre d'équipements sélectionnés
  // ---------------------------------------------------------

  get selectedEquipementsCount(): number {
    const selectedIds = this.reservationForm.get('equipementIds')?.value ?? [];

    return selectedIds.length;
  }

  // ---------------------------------------------------------
  // Motif
  // ---------------------------------------------------------

  get motifLength(): number {
    const motif = this.reservationForm.get('motif')?.value ?? '';

    return motif.length;
  }

  // ---------------------------------------------------------
  // Validation champ
  // ---------------------------------------------------------

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reservationForm.get(fieldName);

    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  // ---------------------------------------------------------
  // Soumission
  // ---------------------------------------------------------

  onSubmit(): void {
    this.error.set(null);

    this.clearAvailability();

    // Validation Angular
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();

      this.error.set('Veuillez vérifier les informations saisies.');

      return;
    }

    // Validation horaire
    if (!this.isHoraireValide()) {
      this.error.set('L’heure de fin doit être supérieure à l’heure de début.');

      return;
    }

    // Vérification date / heure passée
    if (this.isReservationDansLePasse()) {
      this.error.set('La date ou l’horaire sélectionné est déjà passé.');

      return;
    }

    // Pour l'instant, on simule la disponibilité.
    this.checkAvailability();
  }

  // ---------------------------------------------------------
  // Vérification disponibilité
  // ---------------------------------------------------------

  private checkAvailability(): void {
    this.checkingAvailability.set(true);

    this.error.set(null);

    /*
     * Simulation temporaire.
     *
     * Plus tard cette méthode appellera :
     *
     * reservationService.checkAvailability(...)
     */

    setTimeout(() => {
      this.checkingAvailability.set(false);

      this.availabilitySuccess.set(true);

      this.availabilityMessage.set(
        'Les équipements sélectionnés sont disponibles pour cette période.',
      );

      const request = this.buildReservationRequest();

      this.resume.set(request);

      this.showConfirmation.set(true);
    }, 600);
  }

  // ---------------------------------------------------------
  // Validation horaire
  // ---------------------------------------------------------

  private isHoraireValide(): boolean {
    const heureDebut = this.reservationForm.get('heureDebut')?.value;

    const heureFin = this.reservationForm.get('heureFin')?.value;

    if (!heureDebut || !heureFin) {
      return false;
    }

    const [debutHeure, debutMinute] = heureDebut.split(':').map(Number);

    const [finHeure, finMinute] = heureFin.split(':').map(Number);

    const debut = debutHeure * 60 + debutMinute;

    const fin = finHeure * 60 + finMinute;

    return fin > debut;
  }

  // ---------------------------------------------------------
  // Vérification réservation dans le passé
  // ---------------------------------------------------------

  private isReservationDansLePasse(): boolean {
    const date = this.reservationForm.get('date')?.value;

    const heureDebut = this.reservationForm.get('heureDebut')?.value;

    if (!date || !heureDebut) {
      return false;
    }

    const [heure, minute] = heureDebut.split(':').map(Number);

    const dateReservation = new Date(date);

    dateReservation.setHours(heure, minute, 0, 0);

    return dateReservation < new Date();
  }

  // ---------------------------------------------------------
  // Construction réservation
  // ---------------------------------------------------------

  private buildReservationRequest(): CreateReservationRequest {
    const value = this.reservationForm.value;

    const date = this.formatDate(value.date);

    return {
      laboratoireId: value.laboratoireId,

      equipementIds: value.equipementIds,

      dateDebut: `${date}T${value.heureDebut}:00`,

      dateFin: `${date}T${value.heureFin}:00`,

      motif: value.motif.trim(),
    };
  }

  // ---------------------------------------------------------
  // Format date
  // ---------------------------------------------------------

  private formatDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // ---------------------------------------------------------
  // Laboratoire
  // ---------------------------------------------------------

  getLaboratoireName(): string {
    const laboratoireId = this.reservationForm.get('laboratoireId')?.value;

    return this.laboratoires.find((laboratoire) => laboratoire.id === laboratoireId)?.nom ?? '';
  }

  // ---------------------------------------------------------
  // Équipements
  // ---------------------------------------------------------

  getEquipementsNames(): string {
    const selectedIds: number[] = this.reservationForm.get('equipementIds')?.value ?? [];

    return this.equipements
      .filter((equipement) => selectedIds.includes(equipement.id))
      .map((equipement) => equipement.nom)
      .join(', ');
  }

  // ---------------------------------------------------------
  // Date formatée
  // ---------------------------------------------------------

  getFormattedDate(): string {
    const date = this.reservationForm.get('date')?.value;

    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  // ---------------------------------------------------------
  // Horaire
  // ---------------------------------------------------------

  getHoraire(): string {
    const debut = this.reservationForm.get('heureDebut')?.value;

    const fin = this.reservationForm.get('heureFin')?.value;

    return `${debut} – ${fin}`;
  }

  // ---------------------------------------------------------
  // Disponibilité
  // ---------------------------------------------------------

  private clearAvailability(): void {
    this.availabilityMessage.set(null);

    this.availabilitySuccess.set(false);
  }

  // ---------------------------------------------------------
  // Confirmation
  // ---------------------------------------------------------

  confirmerReservation(): void {
    const request = this.resume();

    if (!request) {
      return;
    }

    this.loading.set(true);

    /*
     * Simulation de création.
     *
     * Plus tard :
     *
     * this.reservationService
     *   .createReservation(request)
     */

    setTimeout(() => {
      console.log('Réservation à créer :', request);

      this.loading.set(false);

      this.showConfirmation.set(false);

      this.reservationForm.reset({
        laboratoireId: null,
        date: this.today,
        heureDebut: '',
        heureFin: '',
        equipementIds: [],
        motif: '',
      });

      this.selectedLaboratoireId.set(null);

      this.clearAvailability();
    }, 800);
  }

  // ---------------------------------------------------------
  // Retour au formulaire
  // ---------------------------------------------------------

  annulerConfirmation(): void {
    this.showConfirmation.set(false);
  }
}
