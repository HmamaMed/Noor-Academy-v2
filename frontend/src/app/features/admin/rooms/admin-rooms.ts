import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';

@Component({
  selector: 'app-admin-rooms',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-rooms.html',
})
export class AdminRooms implements OnInit {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);

  protected rooms = signal<Room[]>([]);
  protected loading = signal(true);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    maxCapacity: [8, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.roomService.findAll().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(room: Room): void {
    this.editingId.set(room.id);
    this.form.setValue({ name: room.name, maxCapacity: room.maxCapacity });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', maxCapacity: 8 });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const request = this.form.getRawValue();
    const editingId = this.editingId();

    const obs = editingId ? this.roomService.update(editingId, request) : this.roomService.create(request);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  delete(room: Room): void {
    if (!confirm(`Delete room "${room.name}"?`)) {
      return;
    }
    this.roomService.delete(room.id).subscribe(() => this.load());
  }
}
