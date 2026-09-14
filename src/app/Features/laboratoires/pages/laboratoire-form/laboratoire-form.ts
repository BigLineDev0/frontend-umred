import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { MessageService } from 'primeng/api';
import { StatutLaboratoire } from '../../../../Core/models/laboratoire.model';
import { SelectModule } from 'primeng/select';

@Component({
  standalone: true,
  selector: 'app-laboratoire-form',
  templateUrl: './laboratoire-form.html',
  styleUrl: './laboratoire-form.css',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule],
})
export class LaboratoireForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly laboratoireService = inject(LaboratoireService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEditMode = signal(false);
  private laboratoireId: number | null = null;

 readonly statutOptions: { label: string; value: StatutLaboratoire }[] = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Indisponible', value: 'INDISPONIBLE' },
];

  laboratoireForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    localisation: ['', [Validators.required, Validators.maxLength(255)]],
    capacite: [null as number | null, [Validators.min(1), Validators.max(1000)]],
    statut: ['DISPONIBLE' as StatutLaboratoire, Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.laboratoireId = Number(id);
      this.isEditMode.set(true);
      this.chargerLaboratoire(this.laboratoireId);
    }
  }

  private chargerLaboratoire(id: number): void {
    this.loading.set(true);
    this.laboratoireService.chargerUn(id).subscribe({
      next: (labo) => {
        this.laboratoireForm.patchValue({
          nom: labo.nom,
          description: labo.description,
          localisation: labo.localisation,
          capacite: labo.capacite,
          statut: labo.statut,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Le laboratoire demandé est introuvable.');
        this.loading.set(false);
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.laboratoireForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  get descriptionLength(): number {
    return this.laboratoireForm.get('description')?.value?.length ?? 0;
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.laboratoireForm.invalid) {
      this.laboratoireForm.markAllAsTouched();
      this.error.set('Veuillez vérifier les informations saisies.');
      return;
    }

    const value = this.laboratoireForm.getRawValue();
    const payload = {
      nom: value.nom!.trim(),
      description: value.description!.trim(),
      localisation: value.localisation!.trim(),
      capacite: value.capacite,
      statut: value.statut!,
    };

    this.loading.set(true);

    const requete = this.isEditMode()
      ? this.laboratoireService.modifier(this.laboratoireId!, payload)
      : this.laboratoireService.creer(payload);

    requete.subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode() ? 'Laboratoire modifié' : 'Laboratoire créé',
          detail: `« ${payload.nom} » a été enregistré avec succès.`,
        });
        this.router.navigate(['/laboratoires']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.nom?.[0] ?? "Une erreur est survenue lors de l'enregistrement.");
      },
    });
  }

  annuler(): void {
    this.router.navigate(['/laboratoires']);
  }
}
