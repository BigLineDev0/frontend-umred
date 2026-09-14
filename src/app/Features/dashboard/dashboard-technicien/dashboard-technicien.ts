import { Component } from '@angular/core';
import { Tag } from "primeng/tag";
import { Button } from "primeng/button";
import { TableModule } from 'primeng/table';
import { PageHeader } from '../../../Shared/components/page-header/page-header';
import { MiniStatCard } from '../../../Shared/components/mini-stat-card/mini-stat-card';

@Component({
  imports: [Tag, Button, TableModule, PageHeader, MiniStatCard],
  selector: 'app-dashboard-technicien',
  styleUrl: './dashboard-technicien.css',
  templateUrl: './dashboard-technicien.html',
})
export class DashboardTechnicien {}
