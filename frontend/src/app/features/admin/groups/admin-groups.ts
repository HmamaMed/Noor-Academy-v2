import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [ReactiveFormsModule],
  templateUrl: './admin-groups.html',
})
export class AdminGroups implements OnInit {
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
  protected errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    courseId: [0, Validators.required],
    teacherId: [0, Validators.required],
    roomId: [0, Validators.required],
    groupName: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    sessions: this.fb.array([this.newSessionGroup()]),
  });

  get sessions(): FormArray {
    return this.form.get('sessions') as FormArray;
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.groupService.findAll().subscribe((groups) => this.groups.set(groups));
    this.courseService.findAll().subscribe((courses) => this.courses.set(courses));
    this.roomService.findAll().subscribe((rooms) => this.rooms.set(rooms));
    this.userService.findAll('TEACHER').subscribe((teachers) => {
      this.teachers.set(teachers);
      this.loading.set(false);
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
  }

  removeSession(index: number): void {
    this.sessions.removeAt(index);
  }

  startEdit(group: Group): void {
    this.editingId.set(group.id);
    this.errorMessage.set(null);
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
    this.errorMessage.set(null);
    this.sessions.clear();
    this.sessions.push(this.newSessionGroup());
    this.form.reset({ courseId: 0, teacherId: 0, roomId: 0, groupName: '', startDate: '', endDate: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const raw = this.form.getRawValue();
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
    const obs = editingId ? this.groupService.update(editingId, request) : this.groupService.create(request);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.loadAll();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not save group.');
      },
    });
  }

  changeStatus(group: Group, status: GroupStatus): void {
    this.groupService.updateStatus(group.id, status).subscribe(() => this.loadAll());
  }

  delete(group: Group): void {
    if (!confirm(`Delete group "${group.groupName}"?`)) {
      return;
    }
    this.groupService.delete(group.id).subscribe(() => this.loadAll());
  }
}
