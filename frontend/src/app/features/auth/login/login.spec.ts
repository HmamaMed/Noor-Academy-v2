import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notifications/toast.service';

describe('Sign-in feedback', () => {
  const auth = { login: vi.fn(), hasRole: vi.fn() };
  beforeEach(() => {
    auth.login.mockReset();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).overrideComponent(Login, { set: { template: '' } });
  });
  it('shows a neutral credential error toast and keeps entered values for retry', () => {
    auth.login.mockReturnValue(
      throwError(() => ({ status: 401, error: { message: 'Invalid password' } })),
    );
    const component = TestBed.createComponent(Login).componentInstance;
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    component['form'].setValue({ email: 'learner@example.test', password: 'wrong-password' });
    component.submit();
    const toast = TestBed.inject(ToastService);
    expect(toast.messages()[0].message).toContain('Check your email and password');
    expect(component['error']()).toBeNull();
    expect(component['form'].controls.email.value).toBe('learner@example.test');
    expect(component['loading']()).toBe(false);
    expect(navigation).not.toHaveBeenCalled();
  });
  it('keeps local field validation in the form and does not send an invalid request', () => {
    const component = TestBed.createComponent(Login).componentInstance;
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component['form'].controls.email.touched).toBe(true);
    expect(TestBed.inject(ToastService).messages()).toHaveLength(0);
  });
});
