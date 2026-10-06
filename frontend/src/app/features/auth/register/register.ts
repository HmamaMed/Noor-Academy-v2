import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Brand } from '../../../shared/design/brand';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Brand, Icon],
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected showPassword = signal(false);
  protected showConfirmation = signal(false);
  protected redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
  protected form = this.fb.nonNullable.group({
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required], phone: [''],
  }, { validators: (group) => group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true } });

  submit(): void {
    if (this.loading()) return;
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.reportError('Check the highlighted account details below.');
      return;
    }
    this.loading.set(true);
    const { confirmPassword, ...request } = this.form.getRawValue();
    this.authService.register(request).subscribe({
      next: () => this.router.navigateByUrl(this.redirectTo?.startsWith('/') && !this.redirectTo.startsWith('//') ? this.redirectTo : '/'),
      error: (err) => {
        this.loading.set(false);
        this.reportError(err.error?.message ?? 'We could not create your account. Please try again.');
      },
    });
  }
  private reportError(message: string) {
    this.error.set(message);
    setTimeout(() => document.getElementById('register-error')?.focus());
  }
}
