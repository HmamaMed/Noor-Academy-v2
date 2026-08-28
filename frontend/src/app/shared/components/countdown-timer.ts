import { Component, OnDestroy, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-countdown-timer',
  template: `
    @if (remainingLabel(); as label) {
      <span class="font-medium" [class.text-danger]="isUrgent()">{{ label }}</span>
    } @else {
      <span class="font-medium text-danger">Expired</span>
    }
  `,
})
export class CountdownTimer implements OnDestroy {
  expiresAt = input.required<string>();

  private now = signal(Date.now());
  private intervalId = setInterval(() => this.now.set(Date.now()), 1000);

  protected remainingMs = computed(() => new Date(this.expiresAt()).getTime() - this.now());

  protected isUrgent = computed(() => this.remainingMs() < 6 * 60 * 60 * 1000);

  protected remainingLabel = computed(() => {
    const ms = this.remainingMs();
    if (ms <= 0) {
      return null;
    }
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  });

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
