import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Course } from '../../../core/models/course.model';
import { Enrollment } from '../../../core/models/enrollment.model';
import { Group } from '../../../core/models/group.model';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { GroupService } from '../../../core/services/group.service';
import { NoorDialog } from '../../../shared/design/dialog';
import { EnrollmentPayment } from '../../../shared/components/enrollment-payment';
import { CourseDetails } from './course-details';

@Component({
  selector: 'app-dialog',
  template: '<section role="dialog" [attr.aria-label]="label()"><ng-content /></section>',
})
class TestDialog {
  label = input('');
  busy = input(false);
  wide = input(false);
  closed = output<void>();
}

@Component({ selector: 'app-enrollment-payment', template: '' })
class TestPayment {
  enrollment = input.required<Enrollment>();
  busyChange = output<boolean>();
}

describe('Course application confirmation', () => {
  const course: Course = {
    id: 1,
    title: 'Arabic',
    description: 'Reading and conversation.',
    syllabus: 'Weekly practice.',
    price: 1500,
    totalSessions: 24,
  };
  const group: Group = {
    id: 2,
    courseId: 1,
    courseTitle: 'Arabic',
    teacherId: 3,
    teacherName: 'Preview Teacher',
    roomId: 4,
    roomName: 'Room A',
    roomCapacity: 12,
    groupName: 'Evening class',
    startDate: '2099-01-01',
    endDate: '2099-06-01',
    status: 'ACTIVE',
    sessions: [{ dayOfWeek: 'MONDAY', startTime: '18:00:00', endTime: '19:00:00' }],
    confirmedSeats: 8,
    remainingSeats: 4,
  };
  const pending: Enrollment = {
    id: 5,
    groupId: 2,
    groupName: group.groupName,
    courseTitle: course.title,
    studentId: 6,
    studentName: 'Preview Student',
    status: 'PENDING',
    appliedAt: '2099-01-01T12:00:00Z',
    confirmedAt: null,
    expiresAt: '2099-01-04T12:00:00Z',
    groupStatus: 'ACTIVE',
    teacherName: group.teacherName,
    roomName: group.roomName,
    startDate: group.startDate,
    endDate: group.endDate,
    sessions: group.sessions,
  };
  let findGroup: ReturnType<typeof vi.fn>;
  let findMine: ReturnType<typeof vi.fn>;
  let apply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findGroup = vi.fn(() => of(group));
    findMine = vi.fn(() => of([]));
    apply = vi.fn(() => of(pending));
    TestBed.configureTestingModule({
      imports: [CourseDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '1' })),
            queryParamMap: of(convertToParamMap({})),
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated: true, hasRole: (role: string) => role === 'STUDENT' },
        },
        { provide: CourseService, useValue: { findById: () => of(course) } },
        { provide: GroupService, useValue: { findAll: () => of([group]), findById: findGroup } },
        { provide: EnrollmentService, useValue: { findMine, apply } },
      ],
    }).overrideComponent(CourseDetails, {
      remove: { imports: [NoorDialog, EnrollmentPayment] },
      add: { imports: [TestDialog, TestPayment] },
    });
  });

  function openConfirmation(fixture: ComponentFixture<CourseDetails>) {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.group-card .btn-primary').click();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
  }

  it('shows an accessible seat meter and asks for confirmation without repeating the full group card', () => {
    const fixture = TestBed.createComponent(CourseDetails);
    const dialog = openConfirmation(fixture);
    expect(fixture.nativeElement.querySelector('.detail-heading').textContent).not.toContain(
      'View available groups',
    );
    const meter = fixture.nativeElement.querySelector('[role="meter"]');
    expect(meter.getAttribute('aria-valuenow')).toBe('8');
    expect(meter.getAttribute('aria-valuemax')).toBe('12');
    expect(meter.getAttribute('aria-valuetext')).toBe('8 of 12 seats filled, 4 remaining');
    expect(dialog.textContent).toContain('Evening class');
    expect(dialog.textContent).toContain('1,500');
    expect(dialog.textContent).toContain('24 sessions');
    expect(dialog.textContent).not.toContain(group.teacherName);
    expect(dialog.textContent).not.toContain('18:00');
    expect(apply).not.toHaveBeenCalled();
    (dialog.querySelector('.btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(apply).toHaveBeenCalledExactlyOnceWith(group.id);
    expect(fixture.nativeElement.textContent).toContain('Application received.');
  });

  it('refreshes availability and prevents submission if the last seat is filled before confirmation', () => {
    const fixture = TestBed.createComponent(CourseDetails);
    const dialog = openConfirmation(fixture);
    findGroup.mockReturnValue(
      of({ ...group, status: 'FULL', remainingSeats: 0, confirmedSeats: 12 }),
    );
    (dialog.querySelector('.btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(apply).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain('This group has no remaining seats.');
    expect((dialog.querySelector('.btn-primary') as HTMLButtonElement).disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="meter"]').getAttribute('aria-valuenow'),
    ).toBe('12');
  });

  it('opens the existing application instead of posting a duplicate discovered at confirmation', () => {
    const fixture = TestBed.createComponent(CourseDetails);
    const dialog = openConfirmation(fixture);
    findMine.mockReturnValue(of([pending]));
    (dialog.querySelector('.btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(apply).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[aria-label="Confirm application"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Awaiting confirmation.');
  });
});
