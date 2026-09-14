import { Directive, TemplateRef, input } from '@angular/core';

@Directive({
  selector: 'ng-template[appColumnTemplate]',
  standalone: true
})
export class ColumnTemplateDirective {
  appColumnTemplate = input.required<string>();
  constructor(public template: TemplateRef<any>) {}
}
