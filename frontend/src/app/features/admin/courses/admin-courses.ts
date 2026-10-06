import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';
import { Icon } from '../../../shared/design/icon';
import { EmptyState } from '../../../shared/design/empty-state';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-admin-courses',
  imports: [ReactiveFormsModule, AdminConfirm, Icon, EmptyState],
  templateUrl: './admin-courses.html',
  styleUrl: '../admin.css',
})
export class AdminCourses extends AdminEditor implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  protected courses = signal<Course[]>([]);

  protected loading = signal(true);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected override form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    syllabus: [''],
  });

  protected deleteTarget = signal<Course | null>(null);
  protected deleteError = signal('');

  startCreate(): void { this.openEditor(() => this.cancelEdit()); }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.courseService.findAll().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err.error?.message ?? 'We couldn’t load courses. Try again.');
      },
    });
  }

  startEdit(course: Course): void {
    this.openEditor(() => this.editRecord(course));
  }

  private editRecord(course: Course): void {
    this.editingId.set(course.id);
    this.form.setValue({
      title: course.title,
      description: course.description ?? '',
      syllabus: course.syllabus ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', description: '', syllabus: '' });
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
      ? this.courseService.update(editingId, request)
      : this.courseService.create(request);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(editingId ? 'Course updated.' : 'Course created.');
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

  requestDelete(record: Course): void {
    this.deleteError.set('');
    this.deleteTarget.set(record);
  }

  deleteRecord(): void {
    const record = this.deleteTarget();
    if (!record || this.deleting()) return;
    this.deleting.set(true);
    this.courseService.delete(record.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.success.set('Course deleted.');
        if (this.editingId() === record.id) this.finishEditor();
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(err.error?.message ?? 'Could not delete this course. Please try again.');
      },
    });
  }
}
