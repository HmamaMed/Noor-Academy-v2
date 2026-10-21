import { ToastService } from '../../../core/notifications/toast.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, from, mergeMap, of, switchMap, toArray } from 'rxjs';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Group } from '../../../core/models/group.model';
import { Enrollment, EnrollmentStatus } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { EmptyState } from '../../../shared/design/empty-state';
import { Icon } from '../../../shared/design/icon';
import { NoorDialog } from '../../../shared/design/dialog';
import { AdminConfirm } from '../admin-confirm';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentReceipt } from '../../../shared/components/payment-receipt';

@Component({
  selector: 'app-admin-enrollments',
  imports: [
    DatePipe,
    TitleCasePipe,
    StatusBadge,
    EmptyState,
    Icon,
    NoorDialog,
    AdminConfirm,
    RouterLink,
    PaymentReceipt,
  ],
  templateUrl: './admin-enrollments.html',
  styleUrl: '../admin.css',
})
export class AdminEnrollments implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupService = inject(GroupService);
  private readonly enrollmentService = inject(EnrollmentService);
  private reviewRequest = 0;
  private readonly toast = inject(ToastService);
  private readonly payments = inject(PaymentService);
  protected readonly receiptEnrollmentIds = signal<number[]>([]);
  protected readonly receiptLoadFailed = signal(false);

  protected groups = signal<Group[]>([]);
  protected enrollments = signal<Enrollment[]>([]);
  protected statusFilter = signal<EnrollmentStatus>('PENDING');
  protected groupFilter = signal(0);
  protected statuses: EnrollmentStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED'];
  protected filteredEnrollments = computed(() =>
    this.enrollments()
      .filter(
        (item) =>
          item.status === this.statusFilter() &&
          (!this.groupFilter() || item.groupId === this.groupFilter()),
      )
      .sort((a, b) =>
        this.statusFilter() === 'PENDING'
          ? this.deadlineTime(a) - this.deadlineTime(b)
          : Date.parse(b.appliedAt) - Date.parse(a.appliedAt),
      ),
  );
  protected loading = signal(true);
  protected loadError = signal('');
  protected success = signal('');
  protected selected = signal<Enrollment | null>(null);
  protected selectedGroup = signal<Group | null>(null);
  protected reviewLoading = signal(false);
  protected reviewError = signal('');
  protected reviewReady = signal(false);
  protected paymentVerified = signal(false);
  protected submitting = signal(false);
  protected cancelTarget = signal<Enrollment | null>(null);
  protected cancelError = signal('');

  constructor() {
    for (const source of [this.loadError, this.reviewError, this.cancelError]) {
      effect(() => {
        const message = source();
        if (message) untracked(() => this.toast.error(message));
      });
    }
    effect(() => {
      const message = this.success();
      if (message) untracked(() => this.toast.success(message));
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.submitting()) return;
    this.receiptLoadFailed.set(false);
    this.payments
      .receipts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (receipts) =>
          this.receiptEnrollmentIds.set(receipts.map((receipt) => receipt.enrollmentId)),
        error: () => this.receiptLoadFailed.set(true),
      });
    this.loading.set(true);
    this.loadError.set('');
    // The API exposes rosters by group only. Bound concurrency when assembling the queue.
    this.groupService
      .findAll()
      .pipe(
        switchMap((groups) =>
          (groups.length
            ? from(groups).pipe(
                mergeMap((group) => this.enrollmentService.findByGroup(group.id), 6),
                toArray(),
              )
            : of([] as Enrollment[][])
          ).pipe(switchMap((rosters) => of({ groups, enrollments: rosters.flat() }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.groups.set(data.groups);
          this.enrollments.set(data.enrollments);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(err.error?.message ?? 'We couldn’t load applications. Try again.');
        },
      });
  }

  protected count(status: EnrollmentStatus): number {
    return this.enrollments().filter(
      (item) =>
        item.status === status && (!this.groupFilter() || item.groupId === this.groupFilter()),
    ).length;
  }

  protected filterGroup(value: string): void {
    this.groupFilter.set(Number(value));
  }

  protected deadline(item: Enrollment): string | null {
    if (item.status !== 'PENDING') return null;
    // Prefer the configured server deadline; the existing contract defaults to 72 hours.
    return (
      item.expiresAt ?? new Date(Date.parse(item.appliedAt) + 72 * 60 * 60 * 1000).toISOString()
    );
  }

  private deadlineTime(item: Enrollment): number {
    return Date.parse(this.deadline(item) ?? item.appliedAt);
  }

  protected deadlinePassed(item: Enrollment): boolean {
    return item.status === 'PENDING' && this.deadlineTime(item) <= Date.now();
  }

  protected confirmationReason(): string {
    const item = this.selected();
    const group = this.selectedGroup();
    if (!item || !this.reviewReady() || !group)
      return 'Refresh the application details before confirming.';
    if (item.status !== 'PENDING') return 'Only pending applications can be confirmed.';
    if (this.deadlinePassed(item))
      return 'The application deadline has passed. The server will resolve its status; it cannot be confirmed.';
    if (group.status !== 'ACTIVE') return 'This group is not accepting enrollment confirmations.';
    if (group.remainingSeats <= 0) return 'This group is full. No seats are currently available.';
    return '';
  }

  protected openReview(item: Enrollment): void {
    this.selected.set(item);
    this.selectedGroup.set(null);
    this.paymentVerified.set(false);
    this.reviewError.set('');
    this.refreshReview();
  }

  protected closeReview(): void {
    if (this.submitting()) return;
    this.reviewRequest++;
    this.selected.set(null);
    this.selectedGroup.set(null);
    this.reviewReady.set(false);
  }

  protected refreshReview(preserveError = false): void {
    const selected = this.selected();
    if (!selected) return;
    const request = ++this.reviewRequest;
    this.reviewLoading.set(true);
    this.reviewReady.set(false);
    if (!preserveError) this.reviewError.set('');
    forkJoin({
      group: this.groupService.findById(selected.groupId),
      roster: this.enrollmentService.findByGroup(selected.groupId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ group, roster }) => {
          if (request !== this.reviewRequest) return;
          this.groups.update((groups) =>
            groups.map((item) => (item.id === group.id ? group : item)),
          );
          this.enrollments.update((items) => [
            ...items.filter((item) => item.groupId !== group.id),
            ...roster,
          ]);
          const current = roster.find((item) => item.id === selected.id);
          this.selectedGroup.set(group);
          this.reviewLoading.set(false);
          if (current) {
            this.selected.set(current);
            this.reviewReady.set(true);
          } else {
            this.reviewError.set(
              'This application is no longer available. Close the review and refresh the queue.',
            );
          }
        },
        error: (err) => {
          if (request !== this.reviewRequest) return;
          this.reviewLoading.set(false);
          const message =
            err.error?.message ?? 'Could not refresh the application details. Try again.';
          this.reviewError.update((existing) =>
            preserveError && existing ? `${existing} ${message}` : message,
          );
        },
      });
  }

  protected confirm(): void {
    const selected = this.selected();
    if (!selected || this.submitting() || !this.paymentVerified() || this.confirmationReason())
      return;
    this.submitting.set(true);
    this.reviewError.set('');
    this.enrollmentService
      .confirm(selected.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.applyResponse(updated);
          this.submitting.set(false);
          this.success.set('Enrollment confirmed.');
          this.paymentVerified.set(false);
          this.refreshReview();
        },
        error: (err) => {
          this.submitting.set(false);
          this.reviewError.set(
            err.error?.message ??
              'Could not confirm enrollment. Review the current details and try again.',
          );
          this.paymentVerified.set(false);
          this.refreshReview(true);
        },
      });
  }

  protected requestCancel(): void {
    const selected = this.selected();
    if (!selected || !this.reviewReady() || selected.status === 'CANCELLED' || this.submitting())
      return;
    this.cancelError.set('');
    this.cancelTarget.set(selected);
  }

  protected cancel(): void {
    const target = this.cancelTarget();
    if (!target || this.submitting()) return;
    this.submitting.set(true);
    this.cancelError.set('');
    this.enrollmentService
      .cancel(target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.applyResponse(updated);
          this.submitting.set(false);
          this.cancelTarget.set(null);
          this.success.set('Enrollment cancelled.');
          this.refreshReview();
        },
        error: (err) => {
          this.submitting.set(false);
          this.cancelError.set(
            err.error?.message ?? 'Could not cancel this application. Try again.',
          );
          this.refreshReview();
        },
      });
  }

  private applyResponse(updated: Enrollment): void {
    this.enrollments.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
    this.selected.set(updated);
  }
}
