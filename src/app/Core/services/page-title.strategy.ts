import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

// Titre d'onglet "Page · SenLab" : sans ça, tous les onglets affichaient "SenLab"
// et l'historique du navigateur ne permettait pas de distinguer les pages.
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const titre = this.buildTitle(snapshot);
    this.title.setTitle(titre ? `${titre} · SenLab` : 'SenLab · Gestion intelligente des laboratoires');
  }
}
