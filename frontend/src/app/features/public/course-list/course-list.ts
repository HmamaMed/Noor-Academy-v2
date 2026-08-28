import { Component, OnInit, inject, signal } from '@angular/core';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { CourseCard } from '../../../shared/components/course-card';

@Component({
  selector: 'app-course-list',
  imports: [CourseCard],
  templateUrl: './course-list.html',
})
export class CourseList implements OnInit {
  private courseService = inject(CourseService);

  protected courses = signal<Course[]>([]);
  protected loading = signal(true);

  ngOnInit(): void {
    this.courseService.findAll().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
