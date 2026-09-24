import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { EquipementService } from '../../../../Core/services/equipement.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  standalone: true,
  selector: 'app-equipement-form',
  templateUrl: './equipement-form.html',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule
  ],
})
export class EquipementForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly equipementService = inject(EquipementService);
  private readonly messageService = inject(MessageService);
  readonly laboratoireService = inject(LaboratoireService);

  readonly today = new Date();
  readonly laboratoires = computed(() => this.laboratoireService.laboratoires());

  isEditMode = signal(false);
  equipementId: number | null = null;
  loading = signal(false);
  error = signal<string | null>(null);

  manuelFichier = signal<File | null>(null);
  manuelNomActuel = signal<string | null>(null);

  onFichierSelectionne(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.manuelFichier.set(input.files[0]);
    }
  }

  statutOptions = [
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Réservé', value: 'RESERVE' },
    { label: 'En maintenance', value: 'EN_MAINTENANCE' },
    { label: 'En panne', value: 'EN_PANNE' },
    { label: 'Hors service', value: 'HORS_SERVICE' },
  ];

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    numero_serie: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    marque: ['', Validators.maxLength(100)],
    modele: ['', Validators.maxLength(100)],
    laboratoireId: [null as number | null, Validators.required],
    description: ['', Validators.maxLength(1000)],
    dateAcquisition: [null as Date | null],
    statut: ['DISPONIBLE', Validators.required],
    instructions_utilisation: [''],
    consignes_securite: [''],
    necessite_validation: [false],
    seuil_heures_maintenance: [200, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.laboratoireService.charger();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.equipementId = Number(id);
      this.chargerEquipement(this.equipementId);
    }
  }

  private chargerEquipement(id: number): void {
    this.loading.set(true);
    this.equipementService.chargerUn(id).subscribe({
      next: (e) => {
        this.form.patchValue({
          nom: e.nom,
          numero_serie: e.numero_serie,
          marque: e.marque,
          modele: e.modele,
          laboratoireId: e.laboratoire,
          description: e.description,
          dateAcquisition: e.date_acquisition ? new Date(e.date_acquisition) : null,
          statut: e.statut,
          instructions_utilisation: e.instructions_utilisation,
          consignes_securite: e.consignes_securite,
          necessite_validation: e.necessite_validation,
          seuil_heures_maintenance: e.seuil_heures_maintenance,
        });
        this.manuelNomActuel.set(e.manuel_pdf ? (e.manuel_pdf.split('/').pop() ?? null) : null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("L'équipement demandé est introuvable.");
        this.loading.set(false);
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required']) {
      const labels: Record<string, string> = {
        nom: "Le nom de l'équipement est obligatoire.",
        numero_serie: 'Le numéro de série est obligatoire.',
        laboratoireId: 'Le laboratoire est obligatoire.',
        statut: "L'état est obligatoire.",
      };
      return labels[fieldName] ?? 'Ce champ est obligatoire.';
    }
    if (field.errors['minlength']) return 'Ce champ est trop court.';
    if (field.errors['maxlength']) return 'Ce champ dépasse la longueur maximale autorisée.';
    return 'Valeur invalide.';
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez corriger les erreurs indiquées dans le formulaire.');
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      nom: value.nom!.trim(),
      numero_serie: value.numero_serie!.trim(),
      marque: value.marque?.trim() || '',
      modele: value.modele?.trim() || '',
      laboratoire: value.laboratoireId!,
      description: value.description?.trim() || '',
      date_acquisition: value.dateAcquisition ? this.formatDate(value.dateAcquisition) : null,
      statut: value.statut! as any,
      instructions_utilisation: value.instructions_utilisation?.trim() || '',
      consignes_securite: value.consignes_securite?.trim() || '',
      necessite_validation: value.necessite_validation ?? false,
      seuil_heures_maintenance: value.seuil_heures_maintenance ?? 200,
    };

    this.loading.set(true);

    const requete = this.isEditMode()
      ? this.equipementService.modifier(this.equipementId!, payload)
      : this.equipementService.creer(payload);

    requete.subscribe({
      next: (equipement) => {
        const fichier = this.manuelFichier();
        if (fichier) {
          this.equipementService.televerserManuel(equipement.id, fichier).subscribe({
            next: () => this.finaliserSucces(payload.nom),
            error: () => {
              this.finaliserSucces(payload.nom);
              this.messageService.add({
                severity: 'warn',
                summary: 'Manuel non enregistré',
                detail: "L'équipement a été enregistré, mais l'envoi du manuel a échoué.",
              });
            },
          });
        } else {
          this.finaliserSucces(payload.nom);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.numero_serie?.[0] ?? "Une erreur est survenue lors de l'enregistrement.",
        );
      },
    });
  }

  private finaliserSucces(nom: string): void {
    this.loading.set(false);
    this.messageService.add({
      severity: 'success',
      summary: this.isEditMode() ? 'Équipement modifié' : 'Équipement ajouté',
      detail: `« ${nom} » a été enregistré avec succès.`,
    });
    this.router.navigate(['/equipements']);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get pageTitle(): string {
    return this.isEditMode() ? "Modifier l'équipement" : 'Nouvel équipement';
  }
  get pageDescription(): string {
    return this.isEditMode()
      ? "Modifiez les informations de l'équipement."
      : 'Ajoutez un nouvel équipement au laboratoire.';
  }
  get submitLabel(): string {
    return this.isEditMode() ? 'Enregistrer les modifications' : "Enregistrer l'équipement";
  }

  annuler(): void {
    this.router.navigate(['/equipements']);
  }
}
