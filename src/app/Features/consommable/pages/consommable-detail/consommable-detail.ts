import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

import { Consommable, MouvementStock } from '../../../../Core/models/consommable.model';
import { ConsommableService } from '../../../../Core/services/consommable.service';
import { AuthService } from '../../../../Core/services/auth.service';
import { MouvementStockModal } from '../../../../Shared/components/mouvement-stock-modal/mouvement-stock-modal';

@Component({
  standalone: true,
  selector: 'app-consommable-detail',
  templateUrl: './consommable-detail.html',
  imports: [RouterLink, DatePipe, ButtonModule, TagModule, TableModule, MouvementStockModal],
})
export class ConsommableDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private consommableService = inject(ConsommableService);
  private authService = inject(AuthService);

  consommable = signal<Consommable | null>(null);
  mouvements = signal<MouvementStock[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  modalVisible = signal(false);
  modalMode = signal<'retirer' | 'reapprovisionner'>('retirer');

  readonly canManage = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'TECHNICIEN';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.charger(id);
  }

  private charger(id: number): void {
    this.consommableService.chargerUn(id).subscribe({
      next: (c) => {
        this.consommable.set(c);
        this.loading.set(false);
        this.chargerMouvements(id);
      },
      error: () => {
        this.error.set('Ce consommable est introuvable.');
        this.loading.set(false);
      },
    });
  }

  private chargerMouvements(id: number): void {
    this.consommableService.chargerMouvements(id).subscribe(m => this.mouvements.set(m));
  }

  ouvrirModale(mode: 'retirer' | 'reapprovisionner'): void {
    this.modalMode.set(mode);
    this.modalVisible.set(true);
  }

  rafraichir(): void {
    const c = this.consommable();
    if (c) this.charger(c.id);
  }

  typeMouvementLabel(type: string): string {
    return { UTILISATION: 'Utilisation', REAPPROVISIONNEMENT: 'Réapprovisionnement', AJUSTEMENT: 'Ajustement' }[type] ?? type;
  }

  typeMouvementSeverity(type: string) {
    return ({ UTILISATION: 'warn', REAPPROVISIONNEMENT: 'success', AJUSTEMENT: 'secondary' } as const)[type] ?? 'secondary';
  }
}
