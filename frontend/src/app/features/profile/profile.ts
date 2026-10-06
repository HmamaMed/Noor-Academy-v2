import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';
import { Icon } from '../../shared/design/icon';
import { NoorDialog } from '../../shared/design/dialog';
@Component({
  selector: 'app-profile', imports: [ReactiveFormsModule, Icon, NoorDialog], templateUrl: './profile.html',
  styles: [':host { display: block; max-width: 45rem; } .profile-header { margin-bottom: 2rem; } .profile-header .eyebrow { margin-bottom: .75rem; } .profile-header p { margin-top: .5rem; } .profile-form { margin-top: 2rem; }'],
})
export class Profile implements OnInit {
  private users = inject(UserService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private resolveLeave?: (leave: boolean) => void;
  protected user = signal<User | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected saved = signal(false);
  protected error = signal<string | null>(null);
  protected loadError = signal(false);
  protected discardOpen = signal(false);
  protected form = this.fb.nonNullable.group({ firstName: ['', Validators.required], lastName: ['', Validators.required], phone: [''] });
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.loadError.set(false);
    this.users.me().subscribe({
      next: (user) => { this.user.set(user); this.auth.updateStoredUser(user); this.restore(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.loadError.set(true); },
    });
  }
  restore() {
    const user = this.user();
    if (user) this.form.reset({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' });
    this.error.set(null); this.saved.set(false);
  }
  save() {
    if (this.saving()) return;
    this.saved.set(false); this.error.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); this.reportError('Enter your first and last name below.'); return; }
    this.saving.set(true);
    this.users.updateMe(this.form.getRawValue()).subscribe({
      next: (user) => { this.user.set(user); this.auth.updateStoredUser(user); this.restore(); this.saving.set(false); this.saved.set(true); },
      error: (err) => { this.saving.set(false); this.reportError(err.error?.message ?? 'We could not save your profile. Please try again.'); },
    });
  }
  canLeave(): boolean | Promise<boolean> {
    if (this.saving()) return false;
    if (!this.form.dirty) return true;
    this.discardOpen.set(true);
    return new Promise(resolve => this.resolveLeave = resolve);
  }
  resolveDiscard(leave: boolean) { this.discardOpen.set(false); this.resolveLeave?.(leave); this.resolveLeave = undefined; }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.form.dirty) { event.preventDefault(); event.returnValue = ''; }
  }
  private reportError(message: string) { this.error.set(message); setTimeout(() => document.getElementById('profile-error')?.focus()); }
}
