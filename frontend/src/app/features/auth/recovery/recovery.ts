import { ToastService } from '../../../core/notifications/toast.service';
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { Brand } from '../../../shared/design/brand';
import { Icon } from '../../../shared/design/icon';
@Component({
  selector: 'app-recovery',
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon],
  templateUrl: './recovery.html',
})
export class Recovery {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  protected resetting = this.route.snapshot.routeConfig?.path === 'reset-password';
  protected busy = signal(false);
  protected message = signal<string | null>(null);
  protected error = signal<string | null>(null);
  protected invalidLink = signal(this.resetting && !this.route.snapshot.queryParamMap.get('token'));
  protected showPassword = signal(false);
  protected showConfirmation = signal(false);
  protected form = this.fb.nonNullable.group(
    {
      email: ['', this.resetting ? [] : [Validators.required, Validators.email]],
      password: [
        '',
        this.resetting
          ? [Validators.required, Validators.minLength(8), Validators.maxLength(72)]
          : [],
      ],
      confirmPassword: ['', this.resetting ? [Validators.required] : []],
    },
    {
      validators: (group) =>
        !this.resetting || group.get('password')?.value === group.get('confirmPassword')?.value
          ? null
          : { mismatch: true },
    },
  );
  submit() {
    if (this.busy() || this.message()) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.reportError(
        this.resetting ? 'Check your new password below.' : 'Enter a valid email address.',
      );
      return;
    }
    const token = this.route.snapshot.queryParamMap.get('token');
    if (this.resetting && !token) {
      this.invalidLink.set(true);
      return;
    }
    this.busy.set(true);
    this.http
      .post<{ message: string }>(
        `${environment.apiUrl}/auth/${this.resetting ? 'reset-password' : 'forgot-password'}`,
        this.resetting
          ? { token, password: this.form.getRawValue().password }
          : { email: this.form.getRawValue().email },
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.message.set(
            this.resetting
              ? 'Your password has been updated. Sign in to continue.'
              : 'If an account exists for this email, we will send a reset link.',
          );
          if (this.resetting) this.auth.logout();
        },
        error: (err) => {
          this.busy.set(false);
          if (this.resetting && /invalid|expired/i.test(err.error?.message ?? ''))
            this.invalidLink.set(true);
          else
            this.toast.error(
              err.error?.message ?? 'We could not complete this request. Please try again.',
            );
        },
      });
  }
  private reportError(message: string) {
    this.error.set(message);
    setTimeout(() => document.getElementById('recovery-error')?.focus());
  }
}
