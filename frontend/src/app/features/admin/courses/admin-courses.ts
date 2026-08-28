import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

@Component({
  selector: 'app-admin-courses',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-courses.html',
})
export class AdminCourses implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  protected courses = signal<Course[]>([]);
  protected loading = signal(true);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    syllabus: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.courseService.findAll().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  startEdit(course: Course): void {
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
        this.cancelEdit();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  delete(course: Course): void {
    if (!confirm(`Delete course "${course.title}"?`)) {
      return;
    }
    this.courseService.delete(course.id).subscribe(() => this.load());
  }
}
