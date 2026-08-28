import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Course } from '../../../core/models/course.model';
import { Group } from '../../../core/models/group.model';
import { StatusBadge } from '../../../shared/components/status-badge';

@Component({
  selector: 'app-course-details',
  imports: [RouterLink, StatusBadge],
  templateUrl: './course-details.html',
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private groupService = inject(GroupService);
  private enrollmentService = inject(EnrollmentService);
  protected authService = inject(AuthService);

  protected course = signal<Course | null>(null);
  protected groups = signal<Group[]>([]);
  protected applyingGroupId = signal<number | null>(null);
  protected feedback = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));

    this.courseService.findById(courseId).subscribe((course) => this.course.set(course));

    this.groupService
      .findAll()
      .subscribe((groups) => this.groups.set(groups.filter((g) => g.courseId === courseId)));
  }

  apply(group: Group): void {
    this.feedback.set(null);

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { redirectTo: this.router.url } });
      return;
    }

    if (!this.authService.hasRole('STUDENT')) {
      this.feedback.set({ type: 'error', text: 'Only students can apply to a group.' });
      return;
    }

    this.applyingGroupId.set(group.id);
    this.enrollmentService.apply(group.id).subscribe({
      next: () => {
        this.applyingGroupId.set(null);
        this.feedback.set({
          type: 'success',
          text: 'Application submitted! It is pending admin confirmation.',
        });
      },
      error: (err) => {
        this.applyingGroupId.set(null);
        this.feedback.set({ type: 'error', text: err.error?.message ?? 'Could not apply.' });
      },
    });
  }
}
