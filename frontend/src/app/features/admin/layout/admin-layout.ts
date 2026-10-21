import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardBreadcrumb } from '../../../shared/components/dashboard-breadcrumb';
@Component({ selector: 'app-admin-layout', imports: [RouterOutlet, DashboardBreadcrumb], templateUrl: './admin-layout.html' })
export class AdminLayout {}
