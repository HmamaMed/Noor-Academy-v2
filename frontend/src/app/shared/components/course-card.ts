import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../core/models/course.model';

@Component({
  selector: 'app-course-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/courses', course().id]"
      class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 class="text-lg font-semibold text-ink">{{ course().title }}</h3>
      <p class="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">
        {{ course().description }}
      </p>
      <span class="mt-4 text-sm font-semibold text-primary-500">View groups &rarr;</span>
    </a>
  `,
})
export class CourseCard {
  course = input.required<Course>();
}
