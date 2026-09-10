import { Component, inject, signal } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { LayoutService } from '../../Core/services/layout.service';
import { RouterLink } from '@angular/router';

@Component({
  imports: [AvatarModule, DividerModule, RouterLink],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
 layoutService = inject(LayoutService);

  closeSidebar() {
    this.layoutService.closeSidebar();
  }

}
