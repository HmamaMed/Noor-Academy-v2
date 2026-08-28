import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { CourseCard } from '../../../shared/components/course-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CourseCard],
  templateUrl: './home.html',
})
export class Home implements OnInit {
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
