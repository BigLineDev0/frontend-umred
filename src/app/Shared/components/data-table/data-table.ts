import { Component, input, output, ContentChildren, QueryList, AfterContentInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ColumnTemplateDirective } from '../column-template.directive';


export interface TableColumn<T> {
  field: (keyof T & string) | string;
  header: string;
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './data-table.html'
})
export class DataTable<T extends Record<string, any>> implements AfterContentInit {
  columns = input.required<TableColumn<T>[]>();
  data = input.required<T[]>();

  // Pensé pour l'API dès maintenant : en mode lazy, p-table ne pagine plus
  // lui-même, il délègue chaque changement de page à l'événement lazyLoad.
  lazy = input(false);
  rows = input(5);
  totalRecords = input<number>();
  lazyLoad = output<{ first: number; rows: number }>();

  @ContentChildren(ColumnTemplateDirective) templateDirectives!: QueryList<ColumnTemplateDirective>;
  private templateMap = new Map<string, TemplateRef<any>>();

  ngAfterContentInit(): void {
    this.templateDirectives.forEach(t => this.templateMap.set(t.appColumnTemplate(), t.template));
  }

  hasTemplate(field: string): boolean {
    return this.templateMap.has(field);
  }

  getTemplate(field: string): TemplateRef<any> | undefined {
    return this.templateMap.get(field);
  }

  onLazyLoad(event: any): void {
    this.lazyLoad.emit({ first: event.first, rows: event.rows });
  }
}
