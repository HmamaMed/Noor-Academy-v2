import { NoorDialog } from '../../../shared/design/dialog';
import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';
import { Icon } from '../../../shared/design/icon';
import { EmptyState } from '../../../shared/design/empty-state';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { Course, CourseImageSettings } from '../../../core/models/course.model';
import { CourseImage } from '../../../shared/design/course-image';

@Component({
  selector: 'app-admin-courses',
  imports: [NoorDialog, ReactiveFormsModule, AdminConfirm, Icon, EmptyState, CourseImage],
  templateUrl: './admin-courses.html',
  styleUrls: ['../admin.css', './admin-courses.css'],
})
export class AdminCourses extends AdminEditor implements OnInit {
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);

  protected courses = signal<Course[]>([]);

  protected loading = signal(true);
  protected imageSettings = signal<CourseImageSettings | null>(null);
  protected imageSettingsError = signal(false);
  protected currentCourse = signal<Course | null>(null);
  protected selectedImage = signal<File | null>(null);
  protected imagePreview = signal<string | null>(null);
  protected imageRemoved = signal(false);
  protected imageError = signal('');
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);

  protected override form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    syllabus: [''],
  });

  protected deleteTarget = signal<Course | null>(null);
  protected override deleteError = signal('');

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.releasePreview());
  }

  startCreate(): void {
    if (!this.saving()) this.openEditor(() => this.cancelEdit());
  }

  loadImageSettings(): void {
    this.imageSettingsError.set(false);
    this.courseService.imageSettings().subscribe({
      next: (settings) => this.imageSettings.set(settings),
      error: () => this.imageSettingsError.set(true),
    });
  }

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageError.set('');
    if (!file) return;
    const settings = this.imageSettings();
    if (!settings?.uploadsEnabled) {
      input.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size === 0) {
      this.imageError.set('Choose a JPEG or PNG image.');
      input.value = '';
      return;
    }
    if (file.size > settings.maxBytes) {
      this.imageError.set('Course images must be 5 MB or smaller.');
      input.value = '';
      return;
    }
    this.releasePreview();
    this.selectedImage.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
    this.imageRemoved.set(false);
    this.form.markAsDirty();
  }

  validatePreview(event: Event): void {
    const image = event.target as HTMLImageElement;
    const max = this.imageSettings()?.maxDimension ?? 4096;
    if (image.naturalWidth > max || image.naturalHeight > max)
      this.rejectPreview('Course images must be no larger than 4096 × 4096 pixels.');
  }

  rejectPreview(message = 'This image could not be read. Choose a valid JPEG or PNG image.'): void {
    this.discardSelectedImage();
    this.imageError.set(message);
  }

  discardSelectedImage(): void {
    this.releasePreview();
    this.selectedImage.set(null);
    this.imageRemoved.set(false);
    this.imageError.set('');
    this.clearImageInput();
    this.form.markAsDirty();
  }

  removeCurrentImage(): void {
    this.discardSelectedImage();
    this.imageRemoved.set(true);
  }

  private releasePreview(): void {
    const url = this.imagePreview();
    if (url) URL.revokeObjectURL(url);
    this.imagePreview.set(null);
  }

  private clearImageInput(): void {
    const input = document.getElementById('course-image-file') as HTMLInputElement | null;
    if (input) input.value = '';
  }

  private resetImages(): void {
    this.releasePreview();
    this.selectedImage.set(null);
    this.currentCourse.set(null);
    this.imageRemoved.set(false);
    this.imageError.set('');
    this.clearImageInput();
  }

  protected override finishEditor(): void {
    super.finishEditor();
    this.resetImages();
  }

  ngOnInit(): void {
    this.load();
    this.loadImageSettings();
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
    if (!this.saving()) this.openEditor(() => this.editRecord(course));
  }

  private editRecord(course: Course): void {
    this.resetImages();
    this.currentCourse.set(course);
    this.editingId.set(course.id);
    this.form.setValue({
      title: course.title,
      description: course.description ?? '',
      syllabus: course.syllabus ?? '',
    });
  }

  cancelEdit(): void {
    this.resetImages();
    this.editingId.set(null);
    this.form.reset({ title: '', description: '', syllabus: '' });
  }

  submit(): void {
    if (this.saving()) return;
    this.formError.set('');
    if (this.imageError()) {
      this.formError.set(this.imageError());
      this.focusError();
      return;
    }
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
      ? this.courseService.update(editingId, request, this.selectedImage(), this.imageRemoved())
      : this.courseService.create(request, this.selectedImage());

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
        this.deleteError.set(
          err.error?.message ?? 'Could not delete this course. Please try again.',
        );
      },
    });
  }
}
