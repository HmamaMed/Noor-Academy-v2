import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Group } from '../../../core/models/group.model';
import { Enrollment } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { Icon } from '../../../shared/design/icon';
import { CourseMotif } from '../../../shared/design/course-motif';
import { NoorDialog } from '../../../shared/design/dialog';
import { nextSession } from '../../../shared/utils/schedule';
import { DashboardBreadcrumb } from '../../../shared/components/dashboard-breadcrumb';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [StatusBadge, RouterLink, DatePipe, TitleCasePipe, Icon, CourseMotif, NoorDialog, DashboardBreadcrumb],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly authService = inject(AuthService);
  protected readonly localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected groups = signal<Group[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected selectedGroup = signal<Group | null>(null);
  protected roster = signal<Enrollment[]>([]);
  protected rosterLoading = signal(false);
  protected rosterError = signal('');
  protected next = computed(() => nextSession(this.groups().filter((group) => group.status === 'ACTIVE' || group.status === 'FULL')));

  ngOnInit() { this.load(); }
  protected load() {
    const teacherId = this.authService.currentUser?.id;
    if (!teacherId) { this.loading.set(false); this.error.set('Sign in again to view your assigned groups.'); return; }
    this.loading.set(true); this.error.set('');
    this.groupService.findAll(teacherId).subscribe({
      next: (groups) => { this.groups.set(groups); this.loading.set(false); },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message ?? 'We couldn’t load your assigned groups. Try again.'); },
    });
  }
  protected openRoster(group: Group) {
    this.selectedGroup.set(group); this.roster.set([]); this.rosterError.set(''); this.rosterLoading.set(true);
    this.enrollmentService.findByGroup(group.id, 'CONFIRMED').subscribe({
      next: (roster) => {
        if (this.selectedGroup()?.id !== group.id) return;
        this.roster.set(roster.filter((enrollment) => enrollment.status === 'CONFIRMED')); this.rosterLoading.set(false);
      },
      error: (err) => {
        if (this.selectedGroup()?.id !== group.id) return;
        this.rosterLoading.set(false); this.rosterError.set(err.error?.message ?? 'We couldn’t load the confirmed students. Try again.');
      },
    });
  }
}
