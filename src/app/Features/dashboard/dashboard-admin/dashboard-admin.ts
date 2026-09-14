import { Component } from '@angular/core';
import { TagModule } from "primeng/tag";
import { Button } from "primeng/button";
import { RouterLink } from '@angular/router';
import { TableModule } from "primeng/table";
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';

@Component({
  imports: [RouterLink, TagModule, Button, TableModule, PageHeader, MiniStatCard],
  selector: 'app-dashboard-admin',
  styleUrl: './dashboard-admin.css',
  templateUrl: './dashboard-admin.html',
})
export class DashboardAdmin {}
