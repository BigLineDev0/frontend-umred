import { Component } from '@angular/core';
import { SiteFooter } from '../Shared/components/site-footer/site-footer';
import { SiteHeader } from '../Shared/components/site-header/site-header';
import { RevealDirective } from '../Shared/directives/reveal.directive';
import { AnimatedNumber } from '../Shared/components/animated-number/animated-number';

@Component({
  imports: [SiteHeader, SiteFooter, RevealDirective, AnimatedNumber],
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {}
