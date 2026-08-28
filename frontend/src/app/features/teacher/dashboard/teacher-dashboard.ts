import { Component, OnInit, inject, signal } from '@angular/core';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Group } from '../../../core/models/group.model';
import { Enrollment } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { GroupRosterTable } from '../../../shared/components/group-roster-table';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [StatusBadge, GroupRosterTable],
  templateUrl: './teacher-dashboard.html',
})
export class TeacherDashboard implements OnInit {
  private groupService = inject(GroupService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);

  protected groups = signal<Group[]>([]);
  protected loading = signal(true);
  protected expandedGroupId = signal<number | null>(null);
  protected roster = signal<Enrollment[]>([]);
  protected rosterLoading = signal(false);

  ngOnInit(): void {
    const teacherId = this.authService.currentUser?.id;
    if (!teacherId) {
      this.loading.set(false);
      return;
    }
    this.groupService.findAll(teacherId).subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleRoster(group: Group): void {
    if (this.expandedGroupId() === group.id) {
      this.expandedGroupId.set(null);
      return;
    }
    this.expandedGroupId.set(group.id);
    this.rosterLoading.set(true);
    this.enrollmentService.findByGroup(group.id, 'CONFIRMED').subscribe({
      next: (roster) => {
        this.roster.set(roster);
        this.rosterLoading.set(false);
      },
      error: () => this.rosterLoading.set(false),
    });
  }
}
