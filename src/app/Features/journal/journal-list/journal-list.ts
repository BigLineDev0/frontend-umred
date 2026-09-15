import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { JournalService } from '../../../Core/services/journal.service';
import { UtilisateurService } from '../../../Core/services/utilisateur.service';
import { badgeAction } from '../../../Shared/utils/journal-badge';


const PAGE_SIZE = 9;

@Component({
  standalone: true,
  selector: 'app-journal-list',
  templateUrl: './journal-list.html',
  imports: [DatePipe, FormsModule, SelectModule, TagModule, PageHeader],
})
export class JournalList implements OnInit {
  readonly journalService = inject(JournalService);
  private utilisateurService = inject(UtilisateurService);
  readonly Math = Math;

  search = signal('');
  selectedUtilisateur = signal<number | null>(null);
  selectedAction = signal<string | null>(null);
  selectedEntite = signal<string | null>(null);
  selectedPeriode = signal<string | null>(null);
  page = signal(1);

  readonly utilisateurOptions = computed(() => [
    { label: 'Tous les utilisateurs', value: null },
    ...this.utilisateurService.utilisateurs().map(u => ({ label: `${u.prenom} ${u.nom}`, value: u.id })),
  ]);

  actionOptions = [
    { label: 'Toutes les actions', value: null },
    { label: 'Création', value: 'création' },
    { label: 'Modification', value: 'modification' },
    { label: 'Suppression', value: 'suppression' },
    { label: 'Validation', value: 'validation' },
    { label: 'Connexion', value: 'connexion' },
    { label: 'Déconnexion', value: 'déconnexion' },
  ];

  entiteOptions = [
    { label: 'Toutes les entités', value: null },
    { label: 'Réservation', value: 'reservation' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Laboratoire', value: 'laboratoire' },
    { label: 'Équipement', value: 'equipement' },
    { label: 'Utilisateur', value: 'utilisateur' },
  ];

  periodeOptions = [
    { label: 'Toute la période', value: null },
    { label: "Aujourd'hui", value: 'today' },
    { label: '7 derniers jours', value: '7d' },
    { label: '30 derniers jours', value: '30d' },
    { label: '3 derniers mois', value: '3m' },
  ];

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.journalService.total() / PAGE_SIZE)));

  readonly pagesAffichees = computed(() => {
    const total = this.totalPages(), courant = this.page();
    const pages: (number | '...')[] = [];
    const ajouter = (p: number) => { if (!pages.includes(p)) pages.push(p); };
    ajouter(1);
    if (courant > 3) pages.push('...');
    for (let p = Math.max(2, courant - 1); p <= Math.min(total - 1, courant + 1); p++) ajouter(p);
    if (courant < total - 2) pages.push('...');
    if (total > 1) ajouter(total);
    return pages;
  });

  ngOnInit(): void {
    this.utilisateurService.charger();
    this.recharger();
  }

  private plageDates(): { dateDebut?: string; dateFin?: string } {
    const p = this.selectedPeriode();
    if (!p) return {};
    const fin = new Date();
    const debut = new Date();
    if (p === '7d') debut.setDate(debut.getDate() - 7);
    if (p === '30d') debut.setDate(debut.getDate() - 30);
    if (p === '3m') debut.setMonth(debut.getMonth() - 3);
    const iso = (d: Date) => d.toISOString().split('T')[0];
    return { dateDebut: iso(debut), dateFin: iso(fin) };
  }

  recharger(): void {
    const { dateDebut, dateFin } = this.plageDates();
    this.journalService.charger({
      search: this.search() || undefined,
      action: this.selectedAction() ?? undefined,
      entite: this.selectedEntite() ?? undefined,
      auteur: this.selectedUtilisateur() ?? undefined,
      dateDebut, dateFin,
      page: this.page(),
      pageSize: PAGE_SIZE,
    });
  }

  onFiltreChange(): void { this.page.set(1); this.recharger(); }
  allerPage(p: number | '...'): void { if (p !== '...') { this.page.set(p); this.recharger(); } }
  pagePrecedente(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.recharger(); } }
  pageSuivante(): void { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.recharger(); } }

  badge(action: string) { return badgeAction(action); }

  entiteLabel(nom: string | null): string {
    if (!nom) return '—';
    const labels: Record<string, string> = { reservation: 'Réservation', maintenance: 'Maintenance', laboratoire: 'Laboratoire', equipement: 'Équipement', utilisateur: 'Utilisateur' };
    return labels[nom] ?? nom;
  }
}
