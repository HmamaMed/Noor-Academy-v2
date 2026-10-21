import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Enrollment } from '../../../core/models/enrollment.model';
import { ToastService } from '../../../core/notifications/toast.service';
import { StatusBadge } from '../../../shared/components/status-badge';
import { CourseMotif } from '../../../shared/design/course-motif';
import { Icon } from '../../../shared/design/icon';
import { NoorDialog } from '../../../shared/design/dialog';
import { dateKey, nextSession, weeklySessions } from '../../../shared/utils/schedule';
import { StudentTestimonials } from './student-testimonials';
import { EnrollmentPayment } from '../../../shared/components/enrollment-payment';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    StatusBadge,
    RouterLink,
    DatePipe,
    TitleCasePipe,
    CourseMotif,
    Icon,
    NoorDialog,
    StudentTestimonials,
    EnrollmentPayment,
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
})
export class StudentDashboard implements OnInit {
  private readonly studentTestimonials = viewChild(StudentTestimonials);
  canLeave(): boolean | Promise<boolean> {
    return this.paymentBusy() ? false : (this.studentTestimonials()?.canLeave() ?? true);
  }
  private readonly toast = inject(ToastService);
  private readonly enrollmentService = inject(EnrollmentService);
  protected section = toSignal(inject(ActivatedRoute).fragment);
  protected readonly today = new Date();
  protected readonly localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected enrollments = signal<Enrollment[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected cancellingId = signal<number | null>(null);
  protected selectedApplication = signal<Enrollment | null>(null);
  protected confirmCancellation = signal(false);
  protected applicationError = signal('');
  protected paymentBusy = signal(false);
  protected closeApplication() {
    if (!this.paymentBusy()) this.selectedApplication.set(null);
  }
  protected confirmed = computed(() =>
    this.enrollments().filter(
      (e) =>
        e.status === 'CONFIRMED' &&
        e.groupStatus !== 'COMPLETED' &&
        e.groupStatus !== 'CANCELLED' &&
        e.endDate >= dateKey(this.today),
    ),
  );
  protected pending = computed(() =>
    this.enrollments()
      .filter((e) => e.status === 'PENDING')
      .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? '')),
  );
  protected history = computed(() =>
    this.enrollments().filter(
      (e) =>
        e.status === 'CANCELLED' || (e.status === 'CONFIRMED' && !this.confirmed().includes(e)),
    ),
  );
  private scheduled = computed(() =>
    this.confirmed().filter((e) => e.groupStatus === 'ACTIVE' || e.groupStatus === 'FULL'),
  );
  protected next = computed(() => nextSession(this.scheduled(), this.today));
  protected agenda = computed(() => weeklySessions(this.scheduled(), this.today));
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.error.set('');
    this.enrollmentService.findMine().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'We couldn’t load your learning dashboard.');
      },
    });
  }
  protected viewApplication(enrollment: Enrollment) {
    this.confirmCancellation.set(false);
    this.applicationError.set('');
    this.selectedApplication.set(enrollment);
  }
  protected cancel(enrollment: Enrollment) {
    if (this.cancellingId() !== null || this.paymentBusy()) return;
    this.cancellingId.set(enrollment.id);
    this.applicationError.set('');
    this.enrollmentService.cancel(enrollment.id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.selectedApplication.set(null);
        this.toast.success('Application cancelled.');
        this.load();
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.applicationError.set(
          err.error?.message ?? 'Could not cancel your application. Try again.',
        );
      },
    });
  }
}
