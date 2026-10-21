import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, forkJoin, map, Subscription } from 'rxjs';
import { CourseService } from '../../../core/services/course.service';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Course } from '../../../core/models/course.model';
import { Group } from '../../../core/models/group.model';
import { Enrollment } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { NoorDialog } from '../../../shared/design/dialog';
import { Icon } from '../../../shared/design/icon';
import { CourseImage } from '../../../shared/design/course-image';
import { EnrollmentPayment } from '../../../shared/components/enrollment-payment';
import { CourseFacts } from '../../../shared/components/course-facts';

@Component({
  selector: 'app-course-details', imports: [RouterLink, DatePipe, TitleCasePipe, StatusBadge, NoorDialog, Icon, CourseImage, EnrollmentPayment, CourseFacts],
  templateUrl: './course-details.html', styleUrl: './course-details.css',
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private groupService = inject(GroupService);
  private enrollmentService = inject(EnrollmentService);
  protected authService = inject(AuthService);
  private courseId = Number(this.route.snapshot.paramMap.get('id'));
  private readonly destroyRef = inject(DestroyRef);
  private courseRequest?: Subscription;
  private groupsRequest?: Subscription;
  private enrollmentsRequest?: Subscription;
  protected intentGroupId = signal(Number(this.route.snapshot.queryParamMap.get('group')));
  protected course = signal<Course | null>(null);
  protected groups = signal<Group[]>([]);
  protected enrollments = signal<Enrollment[]>([]);
  protected loading = signal(true);
  protected notFound = signal(false);
  protected courseError = signal(false);
  protected groupsLoading = signal(true);
  protected groupsError = signal(false);
  protected enrollmentLoading = signal(false);
  protected enrollmentError = signal(false);
  protected applying = signal(false);
  protected reviewGroup = signal<Group | null>(null);
  protected application = signal<Enrollment | null>(null);
  protected error = signal<string | null>(null);
  protected received = signal(false);
  protected paymentBusy = signal(false);
  protected closeApplication() {
    if (!this.paymentBusy()) this.application.set(null);
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.intentGroupId.set(Number(params.get('group')));
    });
    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(id => {
      this.courseId = id;
      this.reviewGroup.set(null); this.application.set(null); this.error.set(null); this.received.set(false);
      this.load();
    });
  }
  load() {
    this.courseRequest?.unsubscribe(); this.groupsRequest?.unsubscribe(); this.enrollmentsRequest?.unsubscribe();
    this.course.set(null); this.groups.set([]); this.enrollments.set([]);
    this.loading.set(true); this.courseError.set(false); this.notFound.set(false);
    if (!Number.isSafeInteger(this.courseId) || this.courseId <= 0) { this.notFound.set(true); this.loading.set(false); return; }
    this.courseRequest = this.courseService.findById(this.courseId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (course) => { this.course.set(course); this.loading.set(false); },
      error: (err) => { this.loading.set(false); if (err.status === 404 || err.status === 400) this.notFound.set(true); else this.courseError.set(true); },
    });
    this.loadGroups(); this.loadEnrollments();
  }
  loadGroups() {
    this.groupsRequest?.unsubscribe();
    this.groupsLoading.set(true); this.groupsError.set(false);
    this.groupsRequest = this.groupService.findAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (groups) => { this.groups.set(groups.filter(g => g.courseId === this.courseId)); this.groupsLoading.set(false); },
      error: () => { this.groupsError.set(true); this.groupsLoading.set(false); },
    });
  }
  loadEnrollments() {
    this.enrollmentsRequest?.unsubscribe();
    if (!this.authService.isAuthenticated || !this.authService.hasRole('STUDENT')) return;
    this.enrollmentLoading.set(true); this.enrollmentError.set(false);
    this.enrollmentsRequest = this.enrollmentService.findMine().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments); this.enrollmentLoading.set(false);
        const group = this.reviewGroup();
        const existing = group && enrollments.find(e => e.groupId === group.id && e.status !== 'CANCELLED');
        if (existing) { this.reviewGroup.set(null); this.application.set(existing); }
      },
      error: () => { this.enrollmentError.set(true); this.enrollmentLoading.set(false); },
    });
  }
  enrollmentFor(group: Group) { return this.enrollments().find(e => e.groupId === group.id && e.status !== 'CANCELLED'); }
  protected seatAvailability(group: Group) {
    const capacity = Math.max(0, group.roomCapacity);
    const remaining = Math.min(capacity, Math.max(0, group.remainingSeats));
    const filled = capacity - remaining;
    return { capacity, remaining, filled, percentage: capacity ? filled / capacity * 100 : 0 };
  }
  availability(group: Group) {
    if (group.status === 'COMPLETED') return 'COMPLETED';
    if (group.status === 'CANCELLED' || group.status === 'DRAFT') return 'INACTIVE';
    if (group.endDate < new Date().toISOString().slice(0, 10)) return 'INACTIVE';
    return group.status === 'FULL' || group.remainingSeats <= 0 ? 'FULL' : 'OPEN';
  }
  reason(group: Group) {
    const availability = this.availability(group);
    return availability === 'FULL'
      ? group.status === 'FULL' && group.remainingSeats > 0
        ? 'This group is marked full and is not accepting applications.'
        : 'This group has no remaining seats.'
      : availability === 'COMPLETED'
        ? 'This group has ended. Confirmed students can still access its materials.'
        : 'This group is not accepting applications.';
  }
  expired(enrollment: Enrollment) { return enrollment.status === 'PENDING' && !!enrollment.expiresAt && new Date(enrollment.expiresAt).getTime() <= Date.now(); }
  review(group: Group) {
    this.error.set(null); this.received.set(false);
    if (!this.authService.isAuthenticated) {
      const redirectTo = this.router.createUrlTree(['/courses', this.courseId], { queryParams: { group: group.id }, fragment: `group-${group.id}` }).toString();
      this.router.navigate(['/login'], { queryParams: { redirectTo } });
      return;
    }
    if (!this.authService.hasRole('STUDENT') || this.availability(group) !== 'OPEN') return;
    this.reviewGroup.set(group);
  }
  submitApplication() {
    const selected = this.reviewGroup();
    if (!selected || this.applying() || this.enrollmentError()) return;
    this.applying.set(true); this.error.set(null);
    // Reconcile current applications before any new POST; the server makes the final capacity decision.
    forkJoin({ group: this.groupService.findById(selected.id), enrollments: this.enrollmentService.findMine() }).subscribe({
      next: ({ group, enrollments }) => {
        this.groups.update(groups => groups.map(g => g.id === group.id ? group : g));
        this.enrollments.set(enrollments); this.reviewGroup.set(group);
        const existing = enrollments.find(e => e.groupId === group.id && e.status !== 'CANCELLED');
        if (existing) { this.application.set(existing); this.reviewGroup.set(null); this.applying.set(false); return; }
        if (this.availability(group) !== 'OPEN') { this.error.set(this.reason(group)); this.applying.set(false); return; }
        this.enrollmentService.apply(group.id).subscribe({
          next: enrollment => {
            this.enrollments.update(items => [...items.filter(e => e.groupId !== group.id), enrollment]);
            this.application.set(enrollment); this.received.set(true); this.reviewGroup.set(null); this.applying.set(false);
          },
          error: err => {
            this.applying.set(false);
            this.error.set(err.error?.message ?? 'We could not verify the application result. Checking your current applications before you try again.');
            this.loadGroups(); this.loadEnrollments();
          },
        });
      },
      error: () => { this.applying.set(false); this.error.set('We could not check the current group and application status. Please try again.'); },
    });
  }
  closeReview() { if (!this.applying()) { this.reviewGroup.set(null); this.error.set(null); } }
}
