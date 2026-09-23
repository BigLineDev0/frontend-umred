import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { ConsommableService } from '../../../../Core/services/consommable.service';
import { LaboratoireService } from '../../../../Core/services/laboratoire.service';

@Component({
  standalone: true,
  selector: 'app-consommable-form',
  templateUrl: './consommable-form.html',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DatePickerModule],
})
export class ConsommableForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consommableService = inject(ConsommableService);
  private messageService = inject(MessageService);
  readonly laboratoireService = inject(LaboratoireService);

  readonly today = new Date();
  isEditMode = signal(false);
  consommableId: number | null = null;
  loading = signal(false);
  error = signal<string | null>(null);

  uniteOptions = [
    { label: 'Millilitres (mL)', value: 'ML' },
    { label: 'Litres (L)', value: 'L' },
    { label: 'Grammes (g)', value: 'G' },
    { label: 'Kilogrammes (kg)', value: 'KG' },
    { label: 'Unité(s)', value: 'UNITE' },
  ];

  form = this.fb.group({
    laboratoireId: [null as number | null, Validators.required],
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    reference: ['', Validators.maxLength(100)],
    unite: ['UNITE', Validators.required],
    quantite_stock: [0, [Validators.required, Validators.min(0)]],
    seuil_alerte: [1, [Validators.required, Validators.min(0)]],
    date_peremption: [null as Date | null],
  });

  ngOnInit(): void {
    this.laboratoireService.charger();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.consommableId = Number(id);
      this.chargerConsommable(this.consommableId);
    }
  }

  private chargerConsommable(id: number): void {
    this.loading.set(true);
    this.consommableService.chargerUn(id).subscribe({
      next: (c) => {
        this.form.patchValue({
          laboratoireId: c.laboratoire,
          nom: c.nom,
          reference: c.reference,
          unite: c.unite,
          quantite_stock: c.quantite_stock,
          seuil_alerte: c.seuil_alerte,
          date_peremption: c.date_peremption ? new Date(c.date_peremption) : null,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Le consommable demandé est introuvable.');
        this.loading.set(false);
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez vérifier les informations saisies.');
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      laboratoire: value.laboratoireId!,
      nom: value.nom!.trim(),
      reference: value.reference?.trim() || '',
      unite: value.unite! as any,
      quantite_stock: value.quantite_stock!,
      seuil_alerte: value.seuil_alerte!,
      date_peremption: value.date_peremption ? this.formatDate(value.date_peremption) : null,
    };

    this.loading.set(true);

    const requete = this.isEditMode()
      ? this.consommableService.modifier(this.consommableId!, payload)
      : this.consommableService.creer(payload);

    requete.subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode() ? 'Consommable modifié' : 'Consommable ajouté',
          detail: `« ${payload.nom} » a été enregistré avec succès.`,
        });
        this.router.navigate(['/consommables']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.nom?.[0] ?? "Une erreur est survenue lors de l'enregistrement.");
      },
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  annuler(): void {
    this.router.navigate(['/consommables']);
  }
}
