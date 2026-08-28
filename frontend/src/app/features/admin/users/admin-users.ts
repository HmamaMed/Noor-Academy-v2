import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Role, User } from '../../../core/models/user.model';

const ROLES: Role[] = ['ADMIN', 'TEACHER', 'STUDENT'];

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  protected roles = ROLES;
  protected users = signal<User[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected roleFilter = signal<Role | null>(null);

  protected form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['TEACHER' as Role, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.userService.findAll(this.roleFilter() ?? undefined).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByRole(role: string): void {
    this.roleFilter.set((role || null) as Role | null);
    this.load();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.userService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'TEACHER' });
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not create user.');
      },
    });
  }

  delete(user: User): void {
    if (!confirm(`Delete user "${user.firstName} ${user.lastName}"?`)) {
      return;
    }
    this.userService.delete(user.id).subscribe(() => this.load());
  }
}
