import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { Footer } from './footer';
import { ContactService, emptyFooterSettings } from '../services/contact.service';
import { AuthService } from '../auth/auth.service';
import { NoorDialog } from '../../shared/design/dialog';

@Component({ selector: 'app-dialog', template: '<ng-content />' })
class TestDialog {
  label = input('');
  busy = input(false);
  closed = output<void>();
}

describe('Footer contact form', () => {
  let response: Subject<void>;
  let send: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    response = new Subject<void>();
    send = vi.fn(() => response);
    TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: null } },
        {
          provide: ContactService,
          useValue: {
            settings: signal(emptyFooterSettings),
            loadSettings: () => of(emptyFooterSettings),
            send,
          },
        },
      ],
    }).overrideComponent(Footer, {
      remove: { imports: [NoorDialog] },
      add: { imports: [TestDialog] },
    });
  });

  it('keeps the message available after a failed send and confirms only after a successful retry', async () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component['openContact']();
    component['form'].setValue({
      name: ' Visitor ',
      email: 'visitor@example.test',
      subject: 'Classes',
      message: 'Where are classes held?',
    });
    component['submit']();
    component['submit']();
    expect(send).toHaveBeenCalledTimes(1);
    expect(component['sent']()).toBe(false);
    response.error({ error: { message: 'Please try again.' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Please try again.');
    expect(component['form'].controls.message.value).toBe('Where are classes held?');
    response = new Subject<void>();
    send.mockReturnValue(response);
    component['submit']();
    response.next();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Your message has reached the Noor Academy team.',
    );
    expect(component['form'].controls.message.value).toBe('');
    expect(send.mock.calls[0][0].name).toBe('Visitor');
  });

  it('rejects blank messages and never submits an invalid email', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component['form'].setValue({
      name: 'Visitor',
      email: 'invalid',
      subject: 'Question',
      message: '   ',
    });
    component['submit']();
    expect(send).not.toHaveBeenCalled();
    expect(component['form'].controls.message.touched).toBe(true);
    expect(component['error']()).toContain('highlighted fields');
  });
});
