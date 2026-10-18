import { ToastService } from '../../../core/notifications/toast.service';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Brand } from '../../../shared/design/brand';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon],
  templateUrl: './login.html',
})
export class Login {
  private readonly toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showPassword = signal(false);
  protected redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.loading()) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.reportError('Check your email and password below.');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        const requested = this.route.snapshot.queryParamMap.get('redirectTo');
        const home = this.authService.hasRole('ADMIN')
          ? '/admin/groups'
          : this.authService.hasRole('TEACHER')
            ? '/teacher/dashboard'
            : '/student/dashboard';
        const redirectTo =
          requested?.startsWith('/') && !requested.startsWith('//') ? requested : home;
        this.router.navigateByUrl(redirectTo);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(
          err.status === 401 || err.status === 403
            ? 'We could not sign you in. Check your email and password and try again.'
            : 'We could not sign you in. Please try again.',
        );
      },
    });
  }
  private reportError(message: string) {
    this.error.set(message);
    setTimeout(() => document.getElementById('login-error')?.focus());
  }
}
