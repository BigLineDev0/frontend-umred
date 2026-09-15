import { Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-animated-number',
  standalone: true,
  template: `{{ displayValue() }}`
})
export class AnimatedNumber {
  value = input.required<number>();
  private display = signal(0);
  displayValue = this.display.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const target = this.value();
      const start = this.display();
      const t0 = performance.now();
      const duree = 600;
      let frame: number;

      const step = (now: number) => {
        const progres = Math.min((now - t0) / duree, 1);
        const ease = 1 - Math.pow(1 - progres, 3);
        this.display.set(Math.round(start + (target - start) * ease));
        if (progres < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      onCleanup(() => cancelAnimationFrame(frame));
    });
  }
}
