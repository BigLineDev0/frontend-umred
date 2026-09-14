import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-row-actions',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="flex gap-1 items-center">
      @if (showView()) {
        <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="view.emit()" />
      }
      @if (showEdit()) {
        <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="edit.emit()" />
      }
      @if (showDelete()) {
        <p-button [icon]="deleteIcon()" [text]="true" [rounded]="true" severity="danger" size="small" (onClick)="delete.emit()" />
      }
      <ng-content />
    </div>
  `
})
export class RowActions {
  showView = input(true);
  showEdit = input(true);
  showDelete = input(true);
  deleteIcon = input('pi pi-trash');

  view = output<void>();
  edit = output<void>();
  delete = output<void>();
}
