import { TestBed } from '@angular/core/testing';
import { CourseFacts } from './course-facts';

describe('Course fee and session information', () => {
  it('distinguishes an unpublished fee from an explicitly free course', () => {
    const fixture = TestBed.createComponent(CourseFacts);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Price on request');
    expect(fixture.nativeElement.textContent).not.toContain('Free');
    fixture.componentRef.setInput('price', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Free');
    expect(fixture.nativeElement.textContent).not.toContain('Price on request');
  });
  it('displays the published amount in MAD with the total course sessions', () => {
    const fixture = TestBed.createComponent(CourseFacts);
    fixture.componentRef.setInput('price', 1234.5);
    fixture.componentRef.setInput('totalSessions', 24);
    fixture.componentRef.setInput('detailed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Full course fee');
    expect(fixture.nativeElement.textContent).toContain('1,234.5');
    expect(fixture.nativeElement.textContent).toContain('MAD');
    expect(fixture.nativeElement.textContent).toContain('24 sessions');
  });
  it('uses a singular session label and gives a clear detailed fallback for unknown lengths', () => {
    const fixture = TestBed.createComponent(CourseFacts);
    fixture.componentRef.setInput('totalSessions', 1);
    fixture.componentRef.setInput('detailed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 session');
    expect(fixture.nativeElement.textContent).not.toContain('1 sessions');
    fixture.componentRef.setInput('totalSessions', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sessions to be announced');
  });
});
