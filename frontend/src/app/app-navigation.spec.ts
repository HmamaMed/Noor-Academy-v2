import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { User } from './core/models/user.model';
import { emptyFooterSettings } from './core/services/contact.service';

describe('Public navigation with the application shell', () => {
  let http: HttpTestingController;
  const course = {
    id: 1,
    title: 'Arabic Language Fundamentals',
    description: 'Learn Arabic',
    syllabus: 'Reading',
  };
  const group = {
    id: 5,
    courseId: 1,
    courseTitle: course.title,
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
  const user = new BehaviorSubject<User | null>(null);
  const dialogMethods = new Map<string, PropertyDescriptor | undefined>();
  const auth = {
    isAuthenticated: false,
    hasRole: (role: string) => user.value?.role === role,
    currentUser$: user,
    get currentUser() {
      return user.value;
    },
  };
  beforeEach(() => {
    auth.isAuthenticated = false;
    user.next(null);
    for (const [name, open] of [
      ['showModal', true],
      ['close', false],
    ] as const) {
      dialogMethods.set(name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name));
      Object.defineProperty(HTMLDialogElement.prototype, name, {
        configurable: true,
        writable: true,
        value: vi.fn(function (this: HTMLDialogElement) {
          this.open = open;
        }),
      });
    }
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    for (const [name, descriptor] of dialogMethods) {
      if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
    }
  });
  it('navigates from the homepage card to groups while preserving the header and footer', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/contact/settings`).flush(emptyFooterSettings);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/courses`).flush([course]);
    http.expectOne(`${environment.apiUrl}/testimonials`).flush([]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('app-course-card a') as HTMLAnchorElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-course-details').textContent).toContain(
      group.groupName,
    );
    expect(fixture.nativeElement.querySelector('app-navbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-footer')).not.toBeNull();
  });
  it('opens an existing application and loads the real payment and receipt components', async () => {
    auth.isAuthenticated = true;
    user.next({
      id: 6,
      firstName: 'Sara',
      lastName: 'Student',
      email: 'sara@example.test',
      role: 'STUDENT',
    } as User);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/contact/settings`).flush(emptyFooterSettings);
    await TestBed.inject(Router).navigateByUrl('/courses/1');
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/courses/1`).flush(course);
    http.expectOne(`${environment.apiUrl}/groups`).flush([group]);
    http.expectOne(`${environment.apiUrl}/enrollments/me`).flush([
      {
        id: 12,
        groupId: 5,
        courseTitle: course.title,
        groupName: group.groupName,
        status: 'PENDING',
        expiresAt: '2099-01-04T12:00:00Z',
      },
    ]);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.group-card .btn-secondary') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/contact/settings`).flush(emptyFooterSettings);
    http.expectOne(`${environment.apiUrl}/payments/settings`).flush({
      bankName: 'Academy Bank',
      accountHolder: 'Noor Academy',
      rib: '123456',
      bankInstructions: '',
      visitInstructions: '',
      openingHours: '',
      receiptUploadsEnabled: true,
      maxReceiptBytes: 5242880,
    });
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/payments/enrollments/12/receipt`).flush(null);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('123456');
    expect(dialog.textContent).toContain('Visit us & pay in person');
    expect(dialog.querySelector('input[type=file]')).not.toBeNull();
  });
});
