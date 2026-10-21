import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav class="meta" aria-label="Breadcrumb">
      <a routerLink="/" class="text-link">Home</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Dashboard</span>
    </nav>
  `,
  styles: `
    :host { display: block; margin-bottom: 1.5rem; }
    nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
    a { min-height: 2.75rem; }
  `,
})
export class DashboardBreadcrumb {}
