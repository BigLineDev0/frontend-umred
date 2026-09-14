import { Component, input, output } from '@angular/core';
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
}
