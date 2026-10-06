import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Navbar } from './navbar';

describe('Navigation sign-out and unsaved changes', () => {
  let logout: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logout = vi.fn();
    navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: Router, useValue: { events: new Subject(), navigate } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null, logout } },
      ],
    }).overrideComponent(Navbar, { set: { template: '' } });
  });

  it('preserves the session when an unsaved-change guard cancels sign-out', async () => {
    navigate.mockResolvedValue(false);
    TestBed.createComponent(Navbar).componentInstance['logout']();
    await Promise.resolve();
    expect(logout).not.toHaveBeenCalled();
  });

  it('clears the session after navigation away from the protected page succeeds', async () => {
    navigate.mockResolvedValue(true);
    TestBed.createComponent(Navbar).componentInstance['logout']();
    await Promise.resolve();
    expect(logout).toHaveBeenCalledOnce();
  });
});
