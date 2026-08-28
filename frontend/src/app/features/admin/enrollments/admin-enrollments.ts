import { Component, OnInit, inject, signal } from '@angular/core';
import { GroupService } from '../../../core/services/group.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { Group } from '../../../core/models/group.model';
import { Enrollment } from '../../../core/models/enrollment.model';
import { GroupRosterTable } from '../../../shared/components/group-roster-table';

@Component({
  selector: 'app-admin-enrollments',
  imports: [GroupRosterTable],
  templateUrl: './admin-enrollments.html',
})
export class AdminEnrollments implements OnInit {
  private groupService = inject(GroupService);
  private enrollmentService = inject(EnrollmentService);

  protected groups = signal<Group[]>([]);
  protected selectedGroupId = signal<number | null>(null);
  protected enrollments = signal<Enrollment[]>([]);
  protected loading = signal(false);

  ngOnInit(): void {
    this.groupService.findAll().subscribe((groups) => this.groups.set(groups));
  }

  onGroupChange(groupId: number): void {
    this.selectedGroupId.set(groupId);
    this.loadRoster();
  }

  private loadRoster(): void {
    const groupId = this.selectedGroupId();
    if (!groupId) {
      return;
    }
    this.loading.set(true);
    this.enrollmentService.findByGroup(groupId).subscribe({
      next: (enrollments) => {
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirm(id: number): void {
    this.enrollmentService.confirm(id).subscribe(() => this.loadRoster());
  }

  cancel(id: number): void {
    this.enrollmentService.cancel(id).subscribe(() => this.loadRoster());
  }
}
