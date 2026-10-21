import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { Enrollment } from '../../../core/models/enrollment.model';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { TestimonialService } from '../../../core/services/testimonial.service';
import { NoorDialog } from '../../../shared/design/dialog';
import { StudentDashboard } from './student-dashboard';
import { StudentTestimonials } from './student-testimonials';

@Component({ selector: 'app-dialog', template: '<ng-content />' })
class TestDialog {
  label = input('');
  busy = input(false);
  closed = output<void>();
}

describe('Student dashboard tabs', () => {
  const current: Enrollment = {
    id: 1,
    groupId: 11,
    courseTitle: 'Arabic',
    groupName: 'Evening Arabic',
    studentId: 5,
    studentName: 'Sara Student',
    status: 'CONFIRMED',
    appliedAt: '2026-01-01T12:00:00Z',
    confirmedAt: '2026-01-02T12:00:00Z',
    expiresAt: null,
    groupStatus: 'ACTIVE',
    teacherName: 'Maryam Khalil',
    roomName: 'Room A',
    startDate: '2020-01-01',
    endDate: '2099-12-31',
    sessions: [{ id: 1, dayOfWeek: 'MONDAY', startTime: '18:00:00', endTime: '20:00:00' }],
  };
  const completed: Enrollment = {
    ...current,
    id: 3,
    groupId: 13,
    courseTitle: 'Tajweed',
    groupName: 'Completed Tajweed',
    groupStatus: 'COMPLETED',
    endDate: '2025-01-01',
  };
  let findMine: ReturnType<typeof vi.fn>;
  let testimonials: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    findMine = vi.fn(() =>
      of([
        current,
        {
          ...current,
          id: 2,
          groupId: 12,
          status: 'PENDING',
          confirmedAt: null,
          expiresAt: '2099-01-04T12:00:00Z',
        },
        completed,
      ]),
    );
    testimonials = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        { provide: AuthService, useValue: { isAuthenticated: true, hasRole: () => true } },
        { provide: EnrollmentService, useValue: { findMine } },
        { provide: TestimonialService, useValue: { mine: testimonials } },
      ],
    }).overrideComponent(StudentTestimonials, {
      remove: { imports: [NoorDialog] },
      add: { imports: [TestDialog] },
    });
  });
  function visiblePanels(harness: RouterTestingHarness) {
    return [...harness.routeNativeElement!.querySelectorAll<HTMLElement>('[role=tabpanel]')].filter(
      (panel) => !panel.hidden,
    );
  }
  async function clickTab(harness: RouterTestingHarness, id: string) {
    (
      harness.routeNativeElement!.querySelector(`#dashboard-tab-${id}`) as HTMLButtonElement
    ).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }
  it('shows one panel at a time and keeps next class and accurate summary counts above every tab', async () => {
    const harness = await RouterTestingHarness.create('/student/dashboard');
    expect(visiblePanels(harness).map((panel) => panel.id)).toEqual(['dashboard-panel-this-week']);
    const overview = harness.routeNativeElement!.querySelector('app-student-overview')!;
    expect(overview.textContent).toContain('Evening Arabic');
    expect([...overview.querySelectorAll('dd')].map((value) => value.textContent!.trim())).toEqual([
      '1',
      '1',
      '1',
    ]);
    for (const id of ['applications', 'past-groups', 'your-voice', 'this-week']) {
      await clickTab(harness, id);
      expect(visiblePanels(harness).map((panel) => panel.id)).toEqual([`dashboard-panel-${id}`]);
      expect(harness.routeNativeElement!.querySelector('app-student-overview')).toBe(overview);
      expect(overview.closest('[role=tabpanel]')).toBeNull();
      const selected = harness.routeNativeElement!.querySelectorAll(
        '[role=tab][aria-selected=true]',
      );
      expect(selected).toHaveLength(1);
      expect(selected[0].getAttribute('aria-controls')).toBe(`dashboard-panel-${id}`);
    }
    expect(findMine).toHaveBeenCalledTimes(1);
    expect(testimonials).toHaveBeenCalledTimes(1);
  });
  it('honors existing section links and restores the selected tab through browser history', async () => {
    const harness = await RouterTestingHarness.create('/student/dashboard#your-voice');
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-your-voice');
    await clickTab(harness, 'applications');
    // The harness navigates directly, without the browser application's bootstrap listener.
    TestBed.inject(Router).setUpLocationChangeListener();
    TestBed.inject(Location).back();
    await vi.waitFor(() =>
      expect(TestBed.inject(Router).url).toBe('/student/dashboard#your-voice'),
    );
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-your-voice');
  });
  it('supports arrow keys, Home, and End with a single keyboard tab stop', async () => {
    const harness = await RouterTestingHarness.create('/student/dashboard');
    for (const [from, key, expected] of [
      ['this-week', 'ArrowRight', 'applications'],
      ['applications', 'End', 'your-voice'],
      ['your-voice', 'ArrowRight', 'this-week'],
      ['this-week', 'ArrowLeft', 'your-voice'],
      ['your-voice', 'Home', 'this-week'],
    ]) {
      const button = harness.routeNativeElement!.querySelector(`#dashboard-tab-${from}`)!;
      button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(visiblePanels(harness)[0].id).toBe(`dashboard-panel-${expected}`);
      expect(document.activeElement?.id).toBe(`dashboard-tab-${expected}`);
      expect(harness.routeNativeElement!.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(
        1,
      );
    }
  });
  it('keeps the story tab and draft when a tab change is cancelled, and switches after discard', async () => {
    const harness = await RouterTestingHarness.create('/student/dashboard#your-voice');
    const story = harness.routeDebugElement!.query(By.directive(StudentTestimonials))
      .componentInstance as StudentTestimonials;
    story['open'](completed);
    story['form'].controls.content.setValue('My unfinished experience');
    story['form'].markAsDirty();
    harness.detectChanges();
    const router = TestBed.inject(Router);
    const keep = router.navigateByUrl('/student/dashboard#applications');
    await vi.waitFor(() => expect(story['confirmDiscard']()).toBe(true));
    story['keepWriting']();
    expect(await keep).toBe(false);
    harness.detectChanges();
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-your-voice');
    expect(story['form'].controls.content.value).toBe('My unfinished experience');
    const discard = router.navigateByUrl('/student/dashboard#applications');
    await vi.waitFor(() => expect(story['confirmDiscard']()).toBe(true));
    story['discardDraft']();
    expect(await discard).toBe(true);
    harness.detectChanges();
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-applications');
  });
  it('prevents switching tabs while a receipt is being uploaded', async () => {
    const harness = await RouterTestingHarness.create('/student/dashboard#applications');
    (harness.routeDebugElement!.componentInstance as StudentDashboard)['paymentBusy'].set(true);
    await clickTab(harness, 'this-week');
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-applications');
  });
  it('defaults unknown fragments to This week and keeps empty states useful', async () => {
    findMine.mockReturnValue(of([]));
    const harness = await RouterTestingHarness.create('/student/dashboard#unknown');
    expect(visiblePanels(harness)[0].id).toBe('dashboard-panel-this-week');
    expect(
      harness.routeNativeElement!.querySelector('app-student-overview')!.textContent,
    ).toContain('Find a class that fits your week');
    await clickTab(harness, 'applications');
    expect(visiblePanels(harness)[0].textContent).toContain('No pending applications.');
    await clickTab(harness, 'past-groups');
    expect(visiblePanels(harness)[0].textContent).toContain('No past groups or applications.');
  });
});
