import { Component, computed, input } from '@angular/core';

const COLORS: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  CONFIRMED: 'bg-success/10 text-success',
  DRAFT: 'bg-primary-100 text-primary-700',
  PENDING: 'bg-warning/10 text-warning',
  FULL: 'bg-warning/10 text-warning',
  COMPLETED: 'bg-primary-100 text-primary-700',
  CANCELLED: 'bg-danger/10 text-danger',
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="colorClass()">
      {{ status() }}
    </span>
  `,
})
export class StatusBadge {
  status = input.required<string>();
  protected colorClass = computed(() => COLORS[this.status()] ?? 'bg-gray-100 text-gray-700');
}
