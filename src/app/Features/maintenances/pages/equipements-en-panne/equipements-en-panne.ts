import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeader } from '../../../../Shared/components/page-header/page-header';
import { EquipementService } from '../../../../Core/services/equipement.service';
import { MaintenanceService } from '../../../../Core/services/maintenance.service';
import { AuthService } from '../../../../Core/services/auth.service';
import { Maintenance } from '../../../../Core/models/maintenance.model';
import { PriseEnChargeModal } from '../prise-en-charge-modal/prise-en-charge-modal';

interface EquipementEnPanneAffiche {
  id: number;
  nom: string;
  laboratoire_nom: string;
  numero_serie: string;
  maintenance: Maintenance | null;
  dejaPriseEnCharge: boolean;
  parMoi: boolean;
}

@Component({
  standalone: true,
  selector: 'app-equipements-en-panne',
  templateUrl: './equipements-en-panne.html',
  imports: [ButtonModule, TooltipModule, RouterLink, PageHeader, PriseEnChargeModal],
})
export class EquipementsEnPanne implements OnInit {
  readonly equipementService = inject(EquipementService);
  private maintenanceService = inject(MaintenanceService);
  private authService = inject(AuthService);

  modalVisible = signal(false);
  maintenanceSelectionnee = signal<Maintenance | null>(null);

  // Fusionne les deux sources : chaque équipement en panne, enrichi de
  // sa maintenance active associée (SIGNALEE, PLANIFIEE ou EN_COURS) —
  // c'est ce qui permet d'afficher honnêtement l'état réel du bouton.
  readonly equipementsAffiches = computed<EquipementEnPanneAffiche[]>(() => {
    const maintenances = this.maintenanceService.maintenances();
    const utilisateurId = this.authService.currentUser()?.id;

    return this.equipementService.equipements().map(e => {
      const maintenance = maintenances.find(m => m.equipement === e.id) ?? null;
      return {
        id: e.id,
        nom: e.nom,
        laboratoire_nom: e.laboratoire_nom,
        numero_serie: e.numero_serie,
        maintenance,
        dejaPriseEnCharge: maintenance?.statut === 'PLANIFIEE' || maintenance?.statut === 'EN_COURS',
        parMoi: maintenance?.technicien === utilisateurId,
      };
    });
  });

  ngOnInit(): void {
    this.rafraichir();
  }

  rafraichir(): void {
    this.equipementService.chargerEnPanne();
    // On récupère toutes les maintenances actives, pas seulement les
    // SIGNALEE — nécessaire pour savoir qu'un équipement est déjà pris
    // en charge (statut PLANIFIEE/EN_COURS) et adapter le bouton en
    // conséquence, plutôt que de laisser croire qu'il est encore libre.
    this.maintenanceService.charger();
  }

  ouvrirPriseEnCharge(equipement: EquipementEnPanneAffiche): void {
    if (!equipement.maintenance || equipement.dejaPriseEnCharge) return;
    this.maintenanceSelectionnee.set(equipement.maintenance);
    this.modalVisible.set(true);
  }
}
