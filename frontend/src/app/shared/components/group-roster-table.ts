import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Enrollment } from '../../core/models/enrollment.model';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-group-roster-table',
  imports: [DatePipe, StatusBadge],
  template: `
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
          <tr>
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">Applied</th>
            <th class="px-4 py-3">Status</th>
            @if (showActions()) {
              <th class="px-4 py-3 text-right">Actions</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (enrollment of enrollments(); track enrollment.id) {
            <tr>
              <td class="px-4 py-3 font-medium text-ink">{{ enrollment.studentName }}</td>
              <td class="px-4 py-3 text-gray-500">{{ enrollment.appliedAt | date: 'medium' }}</td>
              <td class="px-4 py-3"><app-status-badge [status]="enrollment.status" /></td>
              @if (showActions()) {
                <td class="px-4 py-3 text-right">
                  @if (enrollment.status === 'PENDING') {
                    <button
                      (click)="confirm.emit(enrollment.id)"
                      class="mr-2 rounded-md bg-success px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Confirm
                    </button>
                    <button
                      (click)="cancel.emit(enrollment.id)"
                      class="rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Reject
                    </button>
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td colspan="4" class="px-4 py-6 text-center text-gray-400">No students yet.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class GroupRosterTable {
  enrollments = input.required<Enrollment[]>();
  showActions = input(false);

  confirm = output<number>();
  cancel = output<number>();
}
