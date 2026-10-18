import { NoorDialog } from '../../../shared/design/dialog';
import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';
import { Icon } from '../../../shared/design/icon';
import { EmptyState } from '../../../shared/design/empty-state';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Role, User, isAdminRole, roleLabel } from '../../../core/models/user.model';

const ROLES: Role[] = ['ADMIN', 'TEACHER', 'STUDENT'];

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule, AdminConfirm, Icon, EmptyState, NoorDialog],
  templateUrl: './admin-users.html',
  styleUrl: '../admin.css',
})
export class AdminUsers extends AdminEditor implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  protected roles = ROLES;
  protected roleLabel = roleLabel;
  protected users = signal<User[]>([]);
  protected loading = signal(true);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected roleFilter = signal<Role | null>(null);

  protected override form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['TEACHER' as Role, Validators.required],
  });

  protected deleteTarget = signal<User | null>(null);
  protected override deleteError = signal('');

  startCreate(): void {
    this.openEditor(() => this.cancelEdit());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.userService.findAll(this.roleFilter() ?? undefined).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message ?? 'We couldn’t load users. Try again.');
      },
    });
  }

  filterByRole(role: string): void {
    this.roleFilter.set((role || null) as Role | null);
    this.load();
  }

  startEdit(user: User): void {
    this.openEditor(() => this.editRecord(user));
  }

  private editRecord(user: User): void {
    this.editingId.set(user.id);

    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.role.disable();
    this.form.setValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      role: isAdminRole(user.role) ? 'ADMIN' : user.role,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.controls.role.enable();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'TEACHER',
    });
  }

  submit(): void {
    if (this.saving()) return;
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Check the highlighted fields and try again.');
      this.focusError();
      return;
    }

    this.saving.set(true);

    const value = this.form.getRawValue();
    const editingId = this.editingId();
    const action = editingId
      ? this.userService.update(editingId, {
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone,
        })
      : this.userService.create(value);
    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(editingId ? 'User updated.' : 'User created.');
        this.finishEditor();
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Could not save user. Please try again.');
        this.focusError();
      },
    });
  }

  requestDelete(record: User): void {
    if (record.role === 'SUPER_ADMIN') {
      this.toast.error('This administrator account is protected and cannot be deleted.');
      return;
    }
    this.deleteError.set('');
    this.deleteTarget.set(record);
  }

  deleteRecord(): void {
    const record = this.deleteTarget();
    if (!record || this.deleting() || record.role === 'SUPER_ADMIN') return;
    this.deleting.set(true);
    this.userService.delete(record.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.success.set('User deleted.');
        if (this.editingId() === record.id) this.finishEditor();
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err.error?.message ?? 'Could not delete this user. Please try again.');
      },
    });
  }
}
