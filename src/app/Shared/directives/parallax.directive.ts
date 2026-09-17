import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({ selector: '[appParallax]', standalone: true })
export class ParallaxDirective implements OnInit, OnDestroy {
  @Input('appParallax') vitesse = 0.25;
  private el = inject(ElementRef<HTMLElement>);

  private onScroll = () => {
    this.el.nativeElement.style.transform = `translateY(${window.scrollY * this.vitesse}px)`;
  };

  ngOnInit(): void { window.addEventListener('scroll', this.onScroll, { passive: true }); }
  ngOnDestroy(): void { window.removeEventListener('scroll', this.onScroll); }
}
