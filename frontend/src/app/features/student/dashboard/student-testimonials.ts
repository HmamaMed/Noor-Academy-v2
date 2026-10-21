import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Enrollment } from '../../../core/models/enrollment.model';
import {
  Testimonial,
  TestimonialService,
  TestimonialStatus,
} from '../../../core/services/testimonial.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { NoorDialog } from '../../../shared/design/dialog';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-student-testimonials',
  imports: [ReactiveFormsModule, NoorDialog, Icon],
  templateUrl: './student-testimonials.html',
  styleUrl: './student-testimonials.css',
})
export class StudentTestimonials implements OnInit {
  enrollments = input.required<Enrollment[]>();
  private readonly service = inject(TestimonialService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  protected readonly testimonials = signal<Testimonial[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly selected = signal<Enrollment | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmRemoval = signal(false);
  protected readonly confirmDiscard = signal(false);
  private resolveLeave?: (leave: boolean) => void;
  protected readonly available = computed(() =>
    this.enrollments().filter(
      (enrollment) =>
        (enrollment.status === 'CONFIRMED' && enrollment.groupStatus === 'COMPLETED') ||
        this.testimonialFor(enrollment.id),
    ),
  );
  protected readonly existing = computed(() => this.testimonialFor(this.selected()?.id ?? -1));
  protected readonly form = this.fb.nonNullable.group({
    content: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(1200),
        Validators.pattern(/\S/),
      ],
    ],
    publicConsent: [false, Validators.requiredTrue],
  });
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.failed.set(false);
    this.service.mine().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
  protected testimonialFor(enrollmentId: number) {
    return this.testimonials().find((item) => item.enrollmentId === enrollmentId);
  }
  protected statusLabel(status: TestimonialStatus) {
    return { PENDING: 'Awaiting review', APPROVED: 'Published', HIDDEN: 'Not published' }[status];
  }
  protected open(enrollment: Enrollment) {
    this.form.reset();
    this.error.set('');
    this.confirmRemoval.set(false);
    this.confirmDiscard.set(false);
    this.selected.set(enrollment);
  }
  protected close() {
    if (this.busy()) return;
    if (!this.existing() && this.form.dirty) this.confirmDiscard.set(true);
    else this.selected.set(null);
  }
  protected submit() {
    const enrollment = this.selected();
    if (!enrollment || this.busy() || this.existing()) return;
    this.error.set('');
    const value = this.form.getRawValue();
    if (this.form.invalid || value.content.trim().length < 20) {
      this.form.markAllAsTouched();
      this.error.set('Write 20–1,200 characters and agree to public sharing before submitting.');
      this.focusError();
      return;
    }
    this.busy.set(true);
    this.service.submit(enrollment.id, value.content.trim(), value.publicConsent).subscribe({
      next: (testimonial) => {
        this.testimonials.update((items) => [...items, testimonial]);
        this.busy.set(false);
        this.form.reset();
        this.selected.set(null);
        this.toast.success(
          'Thank you for sharing your story. Your testimonial is awaiting review.',
        );
      },
      error: (error) => {
        this.busy.set(false);
        this.error.set(
          error.error?.message ||
            'We couldn’t send your testimonial. Your draft is still here. Please try again.',
        );
        this.focusError();
      },
    });
  }
  protected withdraw() {
    const testimonial = this.existing();
    if (!testimonial || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.service.withdraw(testimonial.id).subscribe({
      next: () => {
        this.testimonials.update((items) => items.filter((item) => item.id !== testimonial.id));
        this.busy.set(false);
        this.selected.set(null);
        this.confirmRemoval.set(false);
        this.toast.success('Your testimonial has been removed.');
      },
      error: () => {
        this.busy.set(false);
        this.error.set('We couldn’t remove your testimonial. Please try again.');
        this.focusError();
      },
    });
  }
  canLeave(): boolean | Promise<boolean> {
    if (this.busy()) return false;
    if (!this.selected() || this.existing() || !this.form.dirty) return true;
    this.confirmDiscard.set(true);
    return new Promise((resolve) => (this.resolveLeave = resolve));
  }
  protected discardDraft() {
    this.form.reset();
    this.selected.set(null);
    this.confirmDiscard.set(false);
    this.resolveLeave?.(true);
    this.resolveLeave = undefined;
  }
  protected keepWriting() {
    this.confirmDiscard.set(false);
    this.resolveLeave?.(false);
    this.resolveLeave = undefined;
  }
  @HostListener('window:beforeunload', ['$event']) protected beforeUnload(
    event: BeforeUnloadEvent,
  ) {
    if (this.selected() && !this.existing() && this.form.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  private focusError() {
    setTimeout(() => document.getElementById('testimonial-form-error')?.focus());
  }
}
