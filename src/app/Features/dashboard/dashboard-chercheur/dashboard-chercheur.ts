import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from "primeng/datepicker";


@Component({
  imports: [RouterLink, ButtonModule, TagModule, DatePickerModule],
  selector: 'app-dashboard-chercheur',
  styleUrl: './dashboard-chercheur.css',
  templateUrl: './dashboard-chercheur.html',
})
export class DashboardChercheur {}
