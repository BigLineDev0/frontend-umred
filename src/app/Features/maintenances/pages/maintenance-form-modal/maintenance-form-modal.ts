import { Component, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-maintenance-form-modal',
  standalone: true,
  imports: [DialogModule, SelectModule, DatePickerModule, TextareaModule, ButtonModule],
  templateUrl: './maintenance-form-modal.html'
})
export class MaintenanceFormModal {
  visible = model(false);

  equipementOptions = [
    { label: 'Spectrophotomètre UV-1800', value: 'spectro' },
    { label: 'Microscope électronique', value: 'microscope' },
    { label: 'Centrifugeuse', value: 'centrifugeuse' }
  ];

  technicienOptions = [
    { label: 'Mamadou Diop', value: 'mamadou' },
    { label: 'Awa Ndiaye', value: 'awa' }
  ];

  typeOptions = [
    { label: 'Préventive', value: 'PREVENTIVE' },
    { label: 'Corrective', value: 'CORRECTIVE' }
  ];

  onAnnuler(): void {
    this.visible.set(false);
  }

  onPlanifier(): void {
    // TODO : appel API POST /maintenances une fois branché
    this.visible.set(false);
  }
}
