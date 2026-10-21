import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Icon } from '../design/icon';

@Component({
  selector: 'app-course-facts',
  imports: [DecimalPipe, Icon],
  template: `
    <div class="course-facts" [class.detailed]="detailed()">
      <div class="course-fee">
        @if (detailed()) {
          <span class="fact-label">Full course fee</span>
        }
        <strong>
          @if (price() == null) {
            Price on request
          } @else if (price() === 0) {
            Free
          } @else {
            {{ price() | number: '1.0-2' }} <span class="currency">MAD</span>
          }
        </strong>
        @if (!detailed() && price() != null && price() !== 0) {
          <span class="fee-basis"> / course</span>
        }
      </div>
      @if (totalSessions() != null || detailed()) {
        <div class="course-length">
          @if (detailed()) {
            <span class="fact-label">Course length</span>
          }
          <span class="session-count"
            ><app-icon name="calendar" />
            @if (totalSessions() != null) {
              {{ totalSessions() }} {{ totalSessions() === 1 ? 'session' : 'sessions' }}
            } @else {
              Sessions to be announced
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .course-facts {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1.25rem;
      font-size: 0.8125rem;
    }
    strong {
      color: var(--noor-primary);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .currency,
    .fee-basis,
    .session-count {
      color: var(--noor-text-muted);
      font-size: 0.75rem;
    }
    .session-count {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    app-icon {
      width: 1rem;
      height: 1rem;
    }
    .detailed {
      padding: 1.25rem;
      background: var(--noor-primary-soft);
      border: 1px solid var(--noor-border);
      border-radius: var(--noor-radius-card);
      gap: 1rem 2rem;
      align-items: start;
    }
    .detailed strong {
      font-size: 1.5rem;
      font-family: var(--noor-font-display);
      font-weight: 500;
    }
    .fact-label {
      display: block;
      margin-bottom: 0.375rem;
      color: var(--noor-text-muted);
      font-size: 0.6875rem;
    }
    .detailed .session-count {
      min-height: 1.875rem;
      font-size: 0.875rem;
    }
  `,
})
export class CourseFacts {
  price = input<number | null | undefined>(null);
  totalSessions = input<number | null | undefined>(null);
  detailed = input(false);
}
