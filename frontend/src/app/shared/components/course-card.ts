import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../core/models/course.model';
import { CourseImage } from '../design/course-image';
import { Icon } from '../design/icon';
import { CourseFacts } from './course-facts';
@Component({
  selector: 'app-course-card',
  imports: [RouterLink, CourseImage, Icon, CourseFacts],
  styles: 'app-course-facts { margin-top: 1rem; }',
  template: ` <article class="course-card" [class.course-card-editorial]="editorial()">
    <app-course-image [course]="course()" />
    <div class="course-card-copy">
      <h3>{{ course().title }}</h3>
      <p>{{ course().description }}</p>
      <app-course-facts [price]="course().price" [totalSessions]="course().totalSessions" />
      <a class="text-link" [routerLink]="['/courses', course().id]"
        >View available groups <app-icon name="arrow" /><span class="sr-only">
          for {{ course().title }}</span
        ></a
      >
    </div>
  </article>`,
})
export class CourseCard {
  course = input.required<Course>();
  editorial = input(false);
}
