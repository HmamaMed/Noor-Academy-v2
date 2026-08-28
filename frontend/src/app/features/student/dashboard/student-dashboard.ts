import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Enrollment } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { CountdownTimer } from '../../../shared/components/countdown-timer';

@Component({
  selector: 'app-student-dashboard',
  imports: [StatusBadge, CountdownTimer],
  templateUrl: './student-dashboard.html',
})
export class StudentDashboard implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  protected enrollments = signal<Enrollment[]>([]);
  protected loading = signal(true);
  protected cancellingId = signal<number | null>(null);

  protected confirmed = computed(() =>
    this.enrollments().filter((e) => e.status === 'CONFIRMED'),
  );
  protected pending = computed(() => this.enrollments().filter((e) => e.status === 'PENDING'));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.enrollmentService.findMine().subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cancel(id: number): void {
    this.cancellingId.set(id);
    this.enrollmentService.cancel(id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.load();
      },
      error: () => this.cancellingId.set(null),
    });
  }
}
