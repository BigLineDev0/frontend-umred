import { Component } from '@angular/core';
import { TagModule } from "primeng/tag";
import { Button } from "primeng/button";
import { RouterLink } from '@angular/router';
import { TableModule } from "primeng/table";

@Component({
  imports: [RouterLink, TagModule, Button, TableModule],
  selector: 'app-dashboard-admin',
  styleUrl: './dashboard-admin.css',
  templateUrl: './dashboard-admin.html',
})
export class DashboardAdmin {}
