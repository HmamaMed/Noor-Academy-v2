import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TestimonialService } from '../../../core/services/testimonial.service';
import { Testimonials } from './testimonials';

describe('Homepage student stories', () => {
  let published: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    published = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      imports: [Testimonials],
      providers: [
        provideRouter([]),
        { provide: TestimonialService, useValue: { published } },
        { provide: AuthService, useValue: { currentUser: null, currentUser$: of(null) } },
      ],
    });
  });
  it('welcomes the first testimonial when the public list is empty', () => {
    const fixture = TestBed.createComponent(Testimonials);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No testimonials just yet.');
    expect(fixture.nativeElement.textContent).toContain('the first to share yours');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toContain('/login');
  });
  it('shows a retry state instead of claiming no testimonials exist when loading fails', () => {
    published.mockReturnValue(throwError(() => new Error('Network unavailable')));
    const fixture = TestBed.createComponent(Testimonials);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('We couldn’t load student stories.');
    expect(fixture.nativeElement.textContent).not.toContain('No testimonials just yet.');
    published.mockReturnValue(of([]));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No testimonials just yet.');
  });
  it('renders published stories as text with the provided public name and course', () => {
    published.mockReturnValue(
      of([
        {
          id: 1,
          content: 'I learned so much. <script>alert(1)</script>',
          studentName: 'Sara B.',
          courseTitle: 'Arabic',
        },
      ]),
    );
    const fixture = TestBed.createComponent(Testimonials);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('blockquote').textContent).toContain(
      '<script>alert(1)</script>',
    );
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.querySelector('figcaption').textContent).toContain('Sara B.');
    expect(fixture.nativeElement.querySelector('figcaption').textContent).toContain('Arabic');
    expect(fixture.nativeElement.textContent).not.toContain('No testimonials just yet.');
  });
});
