import { Component, input } from '@angular/core';

export type StatColor = 'primary' | 'success' | 'danger' | 'accent';

@Component({
  selector: 'app-mini-stat-card',
  standalone: true,
  templateUrl: './mini-stat-card.html'
})
export class MiniStatCard {
  icon = input.required<string>();
  color = input<StatColor>('primary');
  value = input.required<string | number>();
  label = input.required<string>();
}
