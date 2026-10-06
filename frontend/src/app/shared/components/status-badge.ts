import { Component, computed, input } from '@angular/core';
import { Icon } from '../design/icon';
const STATES: Record<string, [string, string, string]> = {
 ACTIVE: ['Active', 'success', 'check'], OPEN: ['Open', 'success', 'check'], CONFIRMED: ['Confirmed', 'success', 'check'],
 PENDING: ['Pending', 'warning', 'clock'], FULL: ['Full', 'neutral', 'users'], DRAFT: ['Draft', 'neutral', 'file'],
 INACTIVE: ['Inactive', 'neutral', 'clock'], COMPLETED: ['Completed', 'neutral', 'check'], CANCELLED: ['Cancelled', 'neutral', 'close'], EXPIRED: ['Expired', 'neutral', 'clock'],
};
@Component({ selector: 'app-status-badge', imports: [Icon], template: `<span class="status-badge" [attr.data-tone]="state()[1]"><app-icon [name]="state()[2]"/>{{ state()[0] }}</span>` })
export class StatusBadge { status = input.required<string>(); protected state = computed(() => STATES[this.status()] ?? [this.status(), 'neutral', 'info']); }
