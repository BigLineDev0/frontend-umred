import { Component, input } from '@angular/core';

export interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'app-stats-grid',
  templateUrl: './stats-grid.html',
})
export class StatsGrid {
  readonly items = input.required<StatItem[]>();
}
