import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  TestimonialPage,
  TestimonialService,
  TestimonialStatus,
} from '../../../core/services/testimonial.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-admin-testimonials',
  imports: [DatePipe, Icon],
  templateUrl: './admin-testimonials.html',
  styleUrl: './admin-testimonials.css',
})
export class AdminTestimonials implements OnInit {
  private readonly service = inject(TestimonialService);
  private readonly toast = inject(ToastService);
  protected readonly reviews = signal<TestimonialPage | null>(null);
  protected readonly filter = signal<TestimonialStatus | ''>('PENDING');
  protected readonly page = signal(0);
  protected readonly loading = signal(false);
  protected readonly savingId = signal<number | null>(null);
  protected readonly error = signal('');
  protected readonly actionError = signal('');
  ngOnInit() {
    this.load();
  }
  protected load(page = this.page()) {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.service.review(this.filter(), page).subscribe({
      next: (reviews) => {
        this.loading.set(false);
        if (page > 0 && page >= reviews.totalPages) {
          this.load(Math.max(0, reviews.totalPages - 1));
          return;
        }
        this.reviews.set(reviews);
        this.page.set(page);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We couldn’t load testimonials. Please try again.');
      },
    });
  }
  protected filterChanged(event: Event) {
    this.filter.set((event.target as HTMLSelectElement).value as TestimonialStatus | '');
    this.load(0);
  }
  protected moderate(id: number, status: TestimonialStatus) {
    if (this.savingId() !== null) return;
    this.savingId.set(id);
    this.actionError.set('');
    this.service.moderate(id, status).subscribe({
      next: () => {
        this.savingId.set(null);
        this.toast.success(
          status === 'APPROVED'
            ? 'Testimonial approved for the homepage.'
            : 'Testimonial hidden from the homepage.',
        );
        this.load();
      },
      error: () => {
        this.savingId.set(null);
        this.actionError.set('We couldn’t update this testimonial. Please try again.');
      },
    });
  }
}
