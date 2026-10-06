import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';
import { Icon } from '../../../shared/design/icon';
import { EmptyState } from '../../../shared/design/empty-state';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';

@Component({
  selector: 'app-admin-rooms',
  imports: [ReactiveFormsModule, AdminConfirm, Icon, EmptyState],
  templateUrl: './admin-rooms.html',
  styleUrl: '../admin.css',
})
export class AdminRooms extends AdminEditor implements OnInit {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);

  protected rooms = signal<Room[]>([]);

  protected loading = signal(true);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected override form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    maxCapacity: [8, [Validators.required, Validators.min(1)]],
  });

  protected deleteTarget = signal<Room | null>(null);
  protected deleteError = signal('');

  startCreate(): void { this.openEditor(() => this.cancelEdit()); }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.roomService.findAll().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message ?? 'We couldn’t load rooms. Try again.');
      },
    });
  }

  startEdit(room: Room): void {
    this.openEditor(() => this.editRecord(room));
  }

  private editRecord(room: Room): void {
    this.editingId.set(room.id);
    this.form.setValue({ name: room.name, maxCapacity: room.maxCapacity });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', maxCapacity: 8 });
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
    const request = this.form.getRawValue();
    const editingId = this.editingId();

    const obs = editingId
      ? this.roomService.update(editingId, request)
      : this.roomService.create(request);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(editingId ? 'Room updated.' : 'Room created.');
        this.finishEditor();
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Could not save changes. Please try again.');
        this.focusError();
      },
    });
  }

  requestDelete(record: Room): void {
    this.deleteError.set('');
    this.deleteTarget.set(record);
  }

  deleteRecord(): void {
    const record = this.deleteTarget();
    if (!record || this.deleting()) return;
    this.deleting.set(true);
    this.roomService.delete(record.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.success.set('Room deleted.');
        if (this.editingId() === record.id) this.finishEditor();
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err.error?.message ?? 'Could not delete this room. Please try again.');
      },
    });
  }
}
