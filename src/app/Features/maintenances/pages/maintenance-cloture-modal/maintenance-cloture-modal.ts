import { Component, input, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

export interface MaintenanceACloturer {
  equipement: string;
  technicien: string;
  datePlanifiee: string;
}

@Component({
  selector: 'app-maintenance-cloture-modal',
  standalone: true,
  imports: [DialogModule, DatePickerModule, TextareaModule, ButtonModule],
  templateUrl: './maintenance-cloture-modal.html'
})
export class MaintenanceClotureModal {
  visible = model(false);
  maintenance = input<MaintenanceACloturer | null>(null);

  onAnnuler(): void {
    this.visible.set(false);
  }

  onCloturer(): void {
    // TODO : appel API PATCH /maintenances/:id/cloturer une fois branché
    this.visible.set(false);
  }
}
