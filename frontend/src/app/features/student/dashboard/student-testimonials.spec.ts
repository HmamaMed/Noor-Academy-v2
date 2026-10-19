import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Enrollment } from '../../../core/models/enrollment.model';
import { Testimonial, TestimonialService } from '../../../core/services/testimonial.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { NoorDialog } from '../../../shared/design/dialog';
import { StudentTestimonials } from './student-testimonials';

@Component({ selector: 'app-dialog', template: '<ng-content />' })
class TestDialog {
  label = input('');
  busy = input(false);
  closed = output<void>();
}

describe('Student testimonial submission', () => {
  const enrollment = {
    id: 11,
    status: 'CONFIRMED',
    groupStatus: 'COMPLETED',
    courseTitle: 'Arabic',
    groupName: 'Evening class',
  } as Enrollment;
  const testimonial: Testimonial = {
    id: 1,
    enrollmentId: 11,
    content: 'These lessons helped me become more confident.',
    studentName: 'Sara B.',
    courseTitle: 'Arabic',
    groupName: 'Evening class',
    status: 'PENDING',
    createdAt: '2026-10-19T12:00:00Z',
  };
  let response: Subject<Testimonial>;
  let submit: ReturnType<typeof vi.fn>;
  let withdraw: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    response = new Subject<Testimonial>();
    submit = vi.fn(() => response);
    withdraw = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [StudentTestimonials],
      providers: [
        provideRouter([]),
        { provide: TestimonialService, useValue: { mine: () => of([]), submit, withdraw } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    }).overrideComponent(StudentTestimonials, {
      remove: { imports: [NoorDialog] },
      add: { imports: [TestDialog] },
    });
  });
  function create(enrollments = [enrollment]) {
    const fixture = TestBed.createComponent(StudentTestimonials);
    fixture.componentRef.setInput('enrollments', enrollments);
    fixture.detectChanges();
    return fixture;
  }
  it('offers submission only for completed, confirmed classes', () => {
    const fixture = create([
      { ...enrollment, id: 1, groupStatus: 'ACTIVE' },
      { ...enrollment, id: 2, status: 'CANCELLED' },
    ]);
    expect(fixture.nativeElement.textContent).toContain('Your story is still taking shape.');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
  it('requires public consent and keeps the draft after a failed request without sending duplicates', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component['open'](enrollment);
    component['form'].setValue({ content: testimonial.content, publicConsent: false });
    component['submit']();
    expect(submit).not.toHaveBeenCalled();
    component['form'].controls.publicConsent.setValue(true);
    component['submit']();
    component['submit']();
    expect(submit).toHaveBeenCalledTimes(1);
    response.error({ error: { message: 'Try again later.' } });
    fixture.detectChanges();
    expect(component['form'].controls.content.value).toBe(testimonial.content);
    expect(fixture.nativeElement.textContent).toContain('Try again later.');
    expect(component['selected']()).toEqual(enrollment);
  });
  it('shows the pending testimonial after success and allows the student to withdraw it', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component['open'](enrollment);
    component['form'].setValue({ content: testimonial.content, publicConsent: true });
    component['submit']();
    response.next(testimonial);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Awaiting review');
    expect(fixture.nativeElement.textContent).toContain('View your testimonial');
    component['open'](enrollment);
    component['withdraw']();
    fixture.detectChanges();
    expect(withdraw).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('Share your experience');
  });
  it('preserves a dirty draft when navigation is cancelled and resolves only after discard is chosen', async () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component['open'](enrollment);
    component['form'].controls.content.setValue('My unfinished story');
    component['form'].markAsDirty();
    const keep = component.canLeave();
    component['keepWriting']();
    expect(await keep).toBe(false);
    expect(component['form'].controls.content.value).toBe('My unfinished story');
    const leave = component.canLeave();
    component['discardDraft']();
    expect(await leave).toBe(true);
    expect(component['form'].controls.content.value).toBe('');
  });
});
