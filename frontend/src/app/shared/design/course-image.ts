import { Component, computed, input, signal } from '@angular/core';
import { Course } from '../../core/models/course.model';
import { environment } from '../../../environments/environment';
import { CourseMotif } from './course-motif';

/** Stable API route refreshes the short-lived R2 link whenever an image is loaded. */
export function courseImageSource(course: Course): string | null {
  if (!course.imageUrl) return null;
  try {
    const url = new URL(course.imageUrl, environment.apiUrl + '/');
    // Course covers come from our API; never turn arbitrary data into an image request.
    const api = new URL(environment.apiUrl);
    return url.origin === api.origin &&
      url.pathname === `${api.pathname}/courses/${course.id}/image`
      ? url.href
      : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-course-image',
  imports: [CourseMotif],
  template: `
    @if (source(); as source) {
      @if (failedSource() !== source) {
        <img
          [src]="source"
          alt=""
          loading="lazy"
          decoding="async"
          (error)="failedSource.set(source)"
        />
      } @else {
        <app-course-motif [title]="course().title" />
      }
    } @else {
      <app-course-motif [title]="course().title" />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 11rem;
      overflow: hidden;
      border-radius: var(--noor-radius-control);
      background: var(--noor-primary-soft);
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    app-course-motif {
      height: 100%;
    }
  `,
})
export class CourseImage {
  course = input.required<Course>();
  protected source = computed(() => courseImageSource(this.course()));
  protected failedSource = signal<string | null>(null);
}
