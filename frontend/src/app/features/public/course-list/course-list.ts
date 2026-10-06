import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { CourseCard } from '../../../shared/components/course-card';
import { Icon } from '../../../shared/design/icon';
import { LearningArt } from '../../../shared/design/learning-art';
@Component({
  selector: 'app-course-list', imports: [RouterLink, CourseCard, Icon, LearningArt], templateUrl: './course-list.html',
  styles: [`.catalog-heading { display:grid; grid-template-columns:7fr 5fr; gap:2rem; align-items:center; margin-block:2rem; } .catalog-heading app-learning-art { max-height:16rem; overflow:hidden; border-radius:var(--noor-radius-feature); } .catalog-heading .lead { margin-top:1.5rem; } .catalog-notice { margin-top:2rem; } @media(max-width:767px) { .catalog-heading { grid-template-columns:1fr; } .catalog-heading app-learning-art { display:none; } }`],
})
export class CourseList implements OnInit {
  private courseService = inject(CourseService);
  protected courses = signal<Course[]>([]); protected loading = signal(true); protected failed = signal(false);
  ngOnInit() { this.load(); }
  protected load() {
    this.loading.set(true); this.failed.set(false);
    this.courseService.findAll().subscribe({next: courses => { this.courses.set(courses); this.loading.set(false); }, error: () => { this.failed.set(true); this.loading.set(false); }});
  }
}
