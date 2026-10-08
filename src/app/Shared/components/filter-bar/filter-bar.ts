import { Component, input, output, signal } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './filter-bar.html'
})
export class FilterBar {
  searchPlaceholder = input('Rechercher...');
  searchChange = output<string>();

  // Valeur courante : sert à afficher le bouton d'effacement.
  readonly valeur = signal('');

  onInput(valeur: string): void {
    this.valeur.set(valeur);
    this.searchChange.emit(valeur);
  }

  effacer(champ: HTMLInputElement): void {
    champ.value = '';
    this.valeur.set('');
    this.searchChange.emit('');
    champ.focus();
  }
}
