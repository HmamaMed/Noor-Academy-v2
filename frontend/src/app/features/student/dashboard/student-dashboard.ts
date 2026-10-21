import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { StudentOverview } from './student-overview';

type DashboardTab = 'this-week' | 'applications' | 'past-groups' | 'your-voice';

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
    StudentOverview,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly section = toSignal(this.route.fragment);
  protected readonly tabs: { id: DashboardTab; label: string }[] = [
    { id: 'this-week', label: 'This week' },
    { id: 'applications', label: 'Applications' },
    { id: 'past-groups', label: 'Past groups' },
    { id: 'your-voice', label: 'Your story' },
  ];
  protected readonly activeTab = computed(
    () => this.tabs.find((tab) => tab.id === this.section())?.id ?? 'this-week',
  );
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
  protected tabCount(tab: DashboardTab): number | null {
    if (tab === 'this-week') return this.agenda().length;
    if (tab === 'applications') return this.pending().length;
    if (tab === 'past-groups') return this.history().length;
    return null;
  }
  protected async selectTab(tab: DashboardTab) {
    if (tab === this.activeTab()) return;
    await this.router.navigate([], { relativeTo: this.route, fragment: tab });
  }
  protected onTabKeydown(event: KeyboardEvent, index: number) {
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
        target = (index + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
        target = (index + this.tabs.length - 1) % this.tabs.length;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = this.tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    void this.selectTab(this.tabs[target].id).then(() => {
      document.getElementById(`dashboard-tab-${this.activeTab()}`)?.focus();
    });
  }
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
