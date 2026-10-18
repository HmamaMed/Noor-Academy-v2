import { NoorDialog } from '../../../shared/design/dialog';
import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';
import { Icon } from '../../../shared/design/icon';
import { EmptyState } from '../../../shared/design/empty-state';
import { StatusBadge } from '../../../shared/components/status-badge';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GroupService } from '../../../core/services/group.service';
import { CourseService } from '../../../core/services/course.service';
import { RoomService } from '../../../core/services/room.service';
import { UserService } from '../../../core/services/user.service';
import { Group, GroupStatus } from '../../../core/models/group.model';
import { Course } from '../../../core/models/course.model';
import { Room } from '../../../core/models/room.model';
import { User } from '../../../core/models/user.model';
import { DayOfWeek } from '../../../core/models/session.model';

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const STATUSES: GroupStatus[] = ['DRAFT', 'ACTIVE', 'FULL', 'COMPLETED', 'CANCELLED'];

@Component({
  selector: 'app-admin-groups',
  imports: [
    NoorDialog,
    ReactiveFormsModule,
    RouterLink,
    AdminConfirm,
    Icon,
    EmptyState,
    StatusBadge,
    DatePipe,
    TitleCasePipe,
  ],
  templateUrl: './admin-groups.html',
  styleUrl: '../admin.css',
})
export class AdminGroups extends AdminEditor implements OnInit {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private courseService = inject(CourseService);
  private roomService = inject(RoomService);
  private userService = inject(UserService);

  protected days = DAYS;
  protected statuses = STATUSES;

  protected groups = signal<Group[]>([]);
  protected courses = signal<Course[]>([]);
  protected rooms = signal<Room[]>([]);
  protected teachers = signal<User[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected editingId = signal<number | null>(null);

  protected override form = this.fb.nonNullable.group({
    courseId: [0, [Validators.required, Validators.min(1)]],
    teacherId: [0, [Validators.required, Validators.min(1)]],
    roomId: [0, [Validators.required, Validators.min(1)]],
    groupName: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    sessions: this.fb.array([this.newSessionGroup()]),
  });

  get sessions(): FormArray {
    return this.form.get('sessions') as FormArray;
  }

  protected courseFilter = signal(0);
  protected statusFilter = signal('');
  protected filteredGroups = computed(() =>
    this.groups().filter(
      (group) =>
        (!this.courseFilter() || group.courseId === this.courseFilter()) &&
        (!this.statusFilter() || group.status === this.statusFilter()),
    ),
  );
  protected deleteTarget = signal<Group | null>(null);
  protected override deleteError = signal('');
  protected updatingStatus = signal<number | null>(null);
  protected statusError = signal('');

  startCreate(): void {
    this.openEditor(() => this.cancelEdit());
  }
  filterCourse(value: string): void {
    this.courseFilter.set(Number(value));
  }
  selectedRoomCapacity(): number | null {
    return (
      this.rooms().find((room) => room.id === Number(this.form.controls.roomId.value))
        ?.maxCapacity ?? null
    );
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      groups: this.groupService.findAll(),
      courses: this.courseService.findAll(),
      rooms: this.roomService.findAll(),
      teachers: this.userService.findAll('TEACHER'),
    }).subscribe({
      next: (data) => {
        this.groups.set(data.groups);
        this.courses.set(data.courses);
        this.rooms.set(data.rooms);
        this.teachers.set(data.teachers);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message ?? 'We couldn’t load group management data.');
      },
    });
  }

  private newSessionGroup() {
    return this.fb.nonNullable.group({
      dayOfWeek: ['MONDAY' as DayOfWeek, Validators.required],
      startTime: ['16:00', Validators.required],
      endTime: ['18:00', Validators.required],
    });
  }

  addSession(): void {
    this.sessions.push(this.newSessionGroup());
    this.form.markAsDirty();
  }

  removeSession(index: number): void {
    this.sessions.removeAt(index);
    this.form.markAsDirty();
  }

  startEdit(group: Group): void {
    this.openEditor(() => this.editRecord(group));
  }

  private editRecord(group: Group): void {
    this.editingId.set(group.id);

    this.sessions.clear();
    group.sessions.forEach((s) =>
      this.sessions.push(
        this.fb.nonNullable.group({
          dayOfWeek: [s.dayOfWeek, Validators.required],
          startTime: [s.startTime.slice(0, 5), Validators.required],
          endTime: [s.endTime.slice(0, 5), Validators.required],
        }),
      ),
    );
    this.form.patchValue({
      courseId: group.courseId,
      teacherId: group.teacherId,
      roomId: group.roomId,
      groupName: group.groupName,
      startDate: group.startDate,
      endDate: group.endDate,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);

    this.sessions.clear();
    this.sessions.push(this.newSessionGroup());
    this.form.reset({
      courseId: 0,
      teacherId: 0,
      roomId: 0,
      groupName: '',
      startDate: '',
      endDate: '',
    });
  }

  submit(): void {
    if (this.saving()) return;
    this.formError.set('');
    if (this.form.invalid || this.sessions.length === 0) {
      this.formError.set(
        'Check the highlighted fields. Select a course, teacher, room, dates, and at least one session.',
      );
      this.focusError();
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.endDate < raw.startDate) {
      this.form.controls.endDate.setErrors({ dateOrder: true });
      this.form.controls.endDate.markAsTouched();
      this.formError.set('End date must be on or after the start date.');
      this.focusError();
      return;
    }
    if (raw.sessions.some((session) => session.endTime <= session.startTime)) {
      this.formError.set('Each weekly session must end after its start time.');
      this.focusError();
      return;
    }
    this.saving.set(true);
    const request = {
      courseId: Number(raw.courseId),
      teacherId: Number(raw.teacherId),
      roomId: Number(raw.roomId),
      groupName: raw.groupName,
      startDate: raw.startDate,
      endDate: raw.endDate,
      sessions: raw.sessions.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: `${s.startTime}:00`,
        endTime: `${s.endTime}:00`,
      })),
    };

    const editingId = this.editingId();
    const obs = editingId
      ? this.groupService.update(editingId, request)
      : this.groupService.create(request);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(editingId ? 'Group updated.' : 'Group created as a draft.');
        this.finishEditor();
        this.cancelEdit();
        this.loadAll();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Could not save group.');
        this.focusError();
      },
    });
  }

  changeStatus(group: Group, status: GroupStatus, select: HTMLSelectElement): void {
    if (this.updatingStatus()) {
      select.value = group.status;
      return;
    }
    this.updatingStatus.set(group.id);
    this.statusError.set('');
    this.groupService.updateStatus(group.id, status).subscribe({
      next: (updated) => {
        this.groups.update((groups) =>
          groups.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.updatingStatus.set(null);
        this.success.set('Group status updated.');
      },
      error: (err) => {
        select.value = group.status;
        this.updatingStatus.set(null);
        this.statusError.set(err.error?.message ?? 'Could not update group status.');
        this.toast.error(this.statusError());
      },
    });
  }

  requestDelete(group: Group): void {
    this.deleteError.set('');
    this.deleteTarget.set(group);
  }

  deleteRecord(): void {
    const group = this.deleteTarget();
    if (!group || this.deleting()) return;
    this.deleting.set(true);
    this.groupService.delete(group.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.success.set('Group deleted.');
        if (this.editingId() === group.id) this.finishEditor();
        this.loadAll();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err.error?.message ?? 'Could not delete this group.');
      },
    });
  }
}
