import { Component } from '@angular/core';
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink,TagModule, ButtonModule],
  selector: 'app-dashboard-etudiant',
  styleUrl: './dashboard-etudiant.css',
  templateUrl: './dashboard-etudiant.html',
})
export class DashboardEtudiant {}
