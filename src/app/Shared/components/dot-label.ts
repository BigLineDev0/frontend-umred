import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dot-label',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-2 text-sm text-text">
      <span class="w-2 h-2 rounded-full shrink-0"
        [class.bg-primary]="color() === 'primary'"
        [class.bg-accent]="color() === 'accent'"></span>
      {{ label() }}
    </span>
  `
})
export class DotLabel {
  color = input<'primary' | 'accent'>('primary');
  label = input.required<string>();
}
