import { Component, computed, input } from '@angular/core';
import { AnimatedNumber } from '../animated-number/animated-number';

export type StatColor = 'primary' | 'success' | 'danger' | 'accent';

@Component({
  selector: 'app-mini-stat-card',
  standalone: true,
  imports: [AnimatedNumber],
  templateUrl: './mini-stat-card.html'
})
export class MiniStatCard {
  icon = input.required<string>();
  color = input<StatColor>('primary');
  value = input.required<string | number>();
  label = input.required<string>();

  // Seuls les nombres sont animés ; 0 reste affiché tel quel (pas de compteur 0 → 0).
  numericValue = computed(() => {
    const v = this.value();
    return typeof v === 'number' && v !== 0 ? v : null;
  });
}
