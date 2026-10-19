import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { CourseCard } from '../../../shared/components/course-card';
import { Icon } from '../../../shared/design/icon';
import { WorkspacePreview } from '../../../shared/design/workspace-preview';
import { Testimonials } from './testimonials';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CourseCard, Icon, WorkspacePreview, Testimonials],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private courseService = inject(CourseService);
  protected courses = signal<Course[]>([]);
  protected loading = signal(true);
  protected failed = signal(false);
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.failed.set(false);
    this.courseService.findAll().subscribe({
      next: (courses) => {
        this.courses.set(courses.slice(0, 4));
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
