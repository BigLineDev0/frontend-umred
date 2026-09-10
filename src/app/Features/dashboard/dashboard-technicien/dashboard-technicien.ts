import { Component } from '@angular/core';
import { Tag } from "primeng/tag";
import { Button } from "primeng/button";
import { TableModule } from 'primeng/table';

@Component({
  imports: [Tag, Button, TableModule],
  selector: 'app-dashboard-technicien',
  styleUrl: './dashboard-technicien.css',
  templateUrl: './dashboard-technicien.html',
})
export class DashboardTechnicien {}
