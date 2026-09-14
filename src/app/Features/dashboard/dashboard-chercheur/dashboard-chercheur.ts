import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from "primeng/datepicker";
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';


@Component({
  imports: [RouterLink, ButtonModule, TagModule, DatePickerModule, PageHeader, MiniStatCard],
  selector: 'app-dashboard-chercheur',
  styleUrl: './dashboard-chercheur.css',
  templateUrl: './dashboard-chercheur.html',
})
export class DashboardChercheur {}
