import { Component, OnInit, inject } from '@angular/core';
import { Sidebar } from "../sidebar/sidebar";
import { Topbar } from "../topbar/topbar";
import { ToastModule } from 'primeng/toast';
import { RouterOutlet } from "@angular/router";
import { FooterDahsboard } from "../footer-dahsboard/footer-dahsboard";
import { AssistantChatApp } from '../../Shared/components/assistant-chat-app/assistant-chat-app';
import { OrganisationService } from '../../Core/services/organisation.service';

@Component({
  imports: [Sidebar, Topbar, RouterOutlet, FooterDahsboard, ToastModule, AssistantChatApp],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout implements OnInit {
  private organisationService = inject(OrganisationService);

  // Espace connecté : on applique l'identité visuelle de l'établissement
  // (logo, couleurs) et on charge ses règles de réservation.
  ngOnInit(): void {
    this.organisationService.charger();
  }
}
