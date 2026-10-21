import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { Course } from '../../../core/models/course.model';
import { Group } from '../../../core/models/group.model';

describe('Course navigation with delayed API responses', () => {
  const course: Course = {
    id: 1,
    title: 'Arabic',
    description: 'Learn Arabic',
    syllabus: 'Reading and writing',
  };
  const group: Group = {
    id: 5,
    courseId: 1,
    courseTitle: 'Arabic',
    teacherId: 3,
    teacherName: 'Maryam Khalil',
    roomId: 2,
    roomName: 'Room B',
    roomCapacity: 15,
    groupName: 'Arabic Evening',
    startDate: '2026-09-01',
    endDate: '2099-12-15',
    status: 'ACTIVE',
    sessions: [{ dayOfWeek: 'THURSDAY', startTime: '17:00:00', endTime: '19:00:00' }],
    confirmedSeats: 1,
    remainingSeats: 14,
  };
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated: false, hasRole: () => false } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('opens the available groups from a real catalog link after course and group requests complete', async () => {
    const harness = await RouterTestingHarness.create('/courses');
    http.expectOne(`${environment.apiUrl}/courses`).flush([course]);
    harness.detectChanges();
    const link = harness.routeNativeElement!.querySelector(
      'app-course-card a',
    ) as HTMLAnchorElement;
    expect(link.textContent).toContain('View available groups');
    link.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/courses/1');
    expect(harness.routeNativeElement!.textContent).toContain('Loading course details');
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    harness.detectChanges();
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Arabic Evening');
    expect(harness.routeNativeElement!.textContent).toContain('14 seats remaining');
    expect(
      harness.routeNativeElement!.querySelector('[role="meter"]')!.getAttribute('aria-valuenow'),
    ).toBe('1');
  });
  it('handles groups arriving before course details and allows retry when availability fails', async () => {
    const harness = await RouterTestingHarness.create('/courses/1');
    http
      .expectOne(`${environment.apiUrl}/groups`)
      .flush({ message: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain(
      'We couldn’t load group availability.',
    );
    (harness.routeNativeElement!.querySelector('.groups button') as HTMLButtonElement).click();
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Arabic Evening');
  });
  it('reloads the course when another course is opened through the same route', async () => {
    const harness = await RouterTestingHarness.create('/courses/1');
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    harness.detectChanges();
    await harness.navigateByUrl('/courses/2');
    http.expectOne(`${environment.apiUrl}/courses/2`).flush({ ...course, id: 2, title: 'Tajweed' });
    http.expectOne(`${environment.apiUrl}/groups`).flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Tajweed');
    expect(harness.routeNativeElement!.textContent).not.toContain('Arabic Evening');
  });
  it('cancels requests for the previous course so late responses cannot overwrite the new page', async () => {
    const harness = await RouterTestingHarness.create('/courses/1');
    const previousCourse = http.expectOne(`${environment.apiUrl}/courses/1`);
    const previousGroups = http.expectOne(`${environment.apiUrl}/groups`);
    await harness.navigateByUrl('/courses/2');
    expect(previousCourse.cancelled).toBe(true);
    expect(previousGroups.cancelled).toBe(true);
    http.expectOne(`${environment.apiUrl}/courses/2`).flush({ ...course, id: 2, title: 'Tajweed' });
    http.expectOne(`${environment.apiUrl}/groups`).flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Tajweed');
  });
  it('updates the highlighted group when only the query parameter changes', async () => {
    const harness = await RouterTestingHarness.create('/courses/1');
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('.group-card.selected')).toBeNull();
    await harness.navigateByUrl('/courses/1?group=5');
    expect(harness.routeNativeElement!.querySelector('.group-card.selected')!.id).toBe('group-5');
    http.expectNone(`${environment.apiUrl}/courses/1`);
  });
  it('shows a useful not-found page for an invalid course URL without requesting groups', async () => {
    const harness = await RouterTestingHarness.create('/courses/not-a-course');
    expect(harness.routeNativeElement!.textContent).toContain('Course not found');
    http.expectNone(`${environment.apiUrl}/groups`);
  });
});
