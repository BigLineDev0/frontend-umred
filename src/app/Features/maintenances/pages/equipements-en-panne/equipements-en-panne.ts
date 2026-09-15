import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { MaintenanceFormModal } from '../maintenance-form-modal/maintenance-form-modal';

@Component({
  standalone: true,
  selector: 'app-equipements-en-panne',
  templateUrl: './equipements-en-panne.html',
  imports: [ButtonModule, RouterLink, PageHeader, MaintenanceFormModal],
})
export class EquipementsEnPanne implements OnInit {
  readonly equipementService = inject(EquipementService);

  formModalVisible = signal(false);
  equipementSelectionne = signal<number | null>(null);

  ngOnInit(): void {
    this.equipementService.chargerEnPanne();
  }

  planifierIntervention(equipementId: number): void {
    this.equipementSelectionne.set(equipementId);
    this.formModalVisible.set(true);
  }
}
