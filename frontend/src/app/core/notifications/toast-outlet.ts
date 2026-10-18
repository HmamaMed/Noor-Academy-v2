import { Component, inject, input } from '@angular/core';
import { Icon } from '../../shared/design/icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-outlet',
  imports: [Icon],
  templateUrl: './toast-outlet.html',
  styles: `
    .toast-stack {
      position: fixed;
      inset: 1rem 1rem auto auto;
      z-index: 60;
      width: min(24rem, calc(100% - 2rem));
      display: grid;
      gap: 0.75rem;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--noor-border);
      border-left: 4px solid var(--noor-error);
      border-radius: var(--noor-radius-card);
      background: var(--noor-surface);
      box-shadow: var(--noor-shadow-raised);
    }
    .toast.success {
      border-left-color: var(--noor-success);
    }
    .toast > app-icon {
      color: var(--noor-error);
    }
    .toast.success > app-icon {
      color: var(--noor-success);
    }
    .toast-copy {
      flex: 1;
      min-width: 0;
      font-size: 0.875rem;
      line-height: 1.25rem;
      overflow-wrap: anywhere;
    }
    .toast-copy p + p {
      margin-top: 0.25rem;
      color: var(--noor-text-muted);
    }
    .toast .icon-button {
      margin: -0.5rem -0.5rem -0.5rem 0;
    }
  `,
})
export class ToastOutlet {
  readonly context = input<object | null>(null);
  protected readonly toast = inject(ToastService);
  protected readonly kinds = ['error', 'success'] as const;

  onFocusOut(id: number, event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
      this.toast.resume(id, 'focus');
    }
  }
}
