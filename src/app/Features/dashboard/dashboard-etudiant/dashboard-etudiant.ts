import { Component } from '@angular/core';
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';

@Component({
  imports: [RouterLink,TagModule, ButtonModule, PageHeader, MiniStatCard],
  selector: 'app-dashboard-etudiant',
  styleUrl: './dashboard-etudiant.css',
  templateUrl: './dashboard-etudiant.html',
})
export class DashboardEtudiant {}
