import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '../../Core/services/layout.service';

@Component({
  imports: [ButtonModule, AvatarModule, InputTextModule, InputIconModule, IconFieldModule, MenuModule],
  selector: 'app-topbar',
  styleUrl: './topbar.css',
  templateUrl: './topbar.html',
})
export class Topbar {
  menuOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }

  private layoutService = inject(LayoutService);

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }
}
