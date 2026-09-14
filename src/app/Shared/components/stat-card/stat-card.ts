import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

export type StatColor = 'primary' | 'success' | 'danger' | 'accent';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [TagModule],
  templateUrl: './stat-card.html'
})
export class StatCard {
  icon = input.required<string>();
  color = input<StatColor>('primary');
  value = input.required<string | number>();
  label = input.required<string>();
  tagLabel = input<string>();
  tagSeverity = input<'success' | 'danger' | 'warn' | 'info'>('info');
  link = input<string>();
}
