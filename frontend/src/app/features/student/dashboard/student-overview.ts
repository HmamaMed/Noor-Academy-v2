import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Enrollment } from '../../../core/models/enrollment.model';
import { StatusBadge } from '../../../shared/components/status-badge';
import { CourseMotif } from '../../../shared/design/course-motif';
import { Icon } from '../../../shared/design/icon';
import { ScheduledSession } from '../../../shared/utils/schedule';

@Component({
  selector: 'app-student-overview',
  imports: [DatePipe, RouterLink, StatusBadge, CourseMotif, Icon],
  templateUrl: './student-overview.html',
  styleUrl: './student-overview.css',
})
export class StudentOverview {
  nextClass = input<ScheduledSession<Enrollment> | null>(null);
  enrolledCount = input(0);
  pendingCount = input(0);
  sessionCount = input(0);
  applicationsRequested = output<void>();
}
