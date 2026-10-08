import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { LaboratoireService } from '../../../../Core/services/laboratoire.service';
import { MessageService } from 'primeng/api';
import { Laboratoire, PHOTO_LABORATOIRE_DEFAUT, StatutLaboratoire } from '../../../../Core/models/laboratoire.model';
import { SelectModule } from 'primeng/select';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { messageErreur } from '../../../../Shared/utils/message-erreur';
import {
  appliquerErreursServeur, messageErreurChamp, nomCommun, texteLong,
} from '../../../../Shared/validators/validators';
import { ImageRepliDirective } from '../../../../Shared/directives/image-repli.directive';

const FORMATS_PHOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

@Component({
  standalone: true,
  selector: 'app-laboratoire-form',
  templateUrl: './laboratoire-form.html',
  styleUrl: './laboratoire-form.css',
  imports: [PageHeader, RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ImageRepliDirective],
})
export class LaboratoireForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly laboratoireService = inject(LaboratoireService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEditMode = signal(false);
  private laboratoireId: number | null = null;

  // --- Photo ---
  readonly photoDefaut = PHOTO_LABORATOIRE_DEFAUT;
  readonly apercuPhoto = signal<string | null>(null);   // photo affichée
  readonly erreurPhoto = signal<string | null>(null);
  private fichierPhoto: File | null = null;              // nouvelle photo à envoyer
  private photoARetirer = false;                         // supprimer la photo existante
  private urlTemporaire: string | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.libererApercu());
  }

 readonly statutOptions: { label: string; value: StatutLaboratoire }[] = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Indisponible', value: 'INDISPONIBLE' },
];

  laboratoireForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, nomCommun()]],
    description: ['', [Validators.required, texteLong({ min: 10, max: 500, obligatoire: true })]],
    localisation: ['', [Validators.required, nomCommun(2, 150)]],
    capacite: [null as number | null, [Validators.min(1), Validators.max(10000)]],
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
        this.apercuPhoto.set(labo.photo);
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

  getFieldError(fieldName: string): string {
    return messageErreurChamp(this.laboratoireForm.get(fieldName));
  }

  onPhoto(event: Event): void {
    const champ = event.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = ''; // permet de re-choisir le même fichier après un refus
    if (!fichier) return;
    if (!FORMATS_PHOTO.includes(fichier.type)) {
      this.erreurPhoto.set('Formats acceptés : JPG, PNG ou WebP.');
      return;
    }
    if (fichier.size > TAILLE_MAX_PHOTO) {
      this.erreurPhoto.set('La photo ne doit pas dépasser 5 Mo.');
      return;
    }
    this.erreurPhoto.set(null);
    this.libererApercu();
    this.fichierPhoto = fichier;
    this.photoARetirer = false;
    this.urlTemporaire = URL.createObjectURL(fichier);
    this.apercuPhoto.set(this.urlTemporaire);
  }

  retirerPhoto(): void {
    this.libererApercu();
    this.fichierPhoto = null;
    this.photoARetirer = this.isEditMode();
    this.erreurPhoto.set(null);
    this.apercuPhoto.set(null);
  }

  private libererApercu(): void {
    if (this.urlTemporaire) URL.revokeObjectURL(this.urlTemporaire);
    this.urlTemporaire = null;
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
      next: (labo) => this.enregistrerPhoto(labo),
      error: (err) => {
        this.loading.set(false);
        const global = appliquerErreursServeur(this.laboratoireForm, err?.error);
        this.error.set(global ?? messageErreur(err, "Une erreur est survenue lors de l'enregistrement."));
      },
    });
  }

  // Deuxième temps : la photo (envoi ou retrait), seulement si elle a changé.
  private enregistrerPhoto(labo: Laboratoire): void {
    const envoi = this.fichierPhoto
      ? this.laboratoireService.televerserPhoto(labo.id, this.fichierPhoto)
      : this.photoARetirer ? this.laboratoireService.retirerPhoto(labo.id) : null;
    if (!envoi) {
      this.terminer(labo.nom);
      return;
    }
    envoi.subscribe({
      next: () => this.terminer(labo.nom),
      error: (err) => {
        // Le laboratoire est enregistré : on le signale sans bloquer.
        this.terminer(labo.nom);
        this.messageService.add({
          severity: 'warn', summary: 'Photo non enregistrée',
          detail: messageErreur(err, "Le laboratoire a été enregistré, mais pas sa photo."),
        });
      },
    });
  }

  private terminer(nom: string): void {
    this.loading.set(false);
    this.messageService.add({
      severity: 'success',
      summary: this.isEditMode() ? 'Laboratoire modifié' : 'Laboratoire créé',
      detail: `« ${nom} » a été enregistré avec succès.`,
    });
    this.router.navigate(['/laboratoires']);
  }

  annuler(): void {
    this.router.navigate(['/laboratoires']);
  }
}
