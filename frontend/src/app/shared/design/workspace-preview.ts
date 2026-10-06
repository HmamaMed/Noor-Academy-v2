import { Component } from '@angular/core';
import { Icon } from './icon';
import { CourseMotif } from './course-motif';

/** A labeled marketing illustration; this is not a student's class data. */
@Component({
  selector: 'app-workspace-preview',
  imports: [Icon, CourseMotif],
  styleUrl: './workspace-preview.css',
  template: ` <div class="workspace-preview" aria-label="Illustrative workspace, example content">
    <div class="preview-heading">
      <span class="eyebrow">Illustrative workspace</span><app-icon name="book" />
    </div>
    <div class="preview-body">
      <div class="preview-navigation" aria-hidden="true">
        <span><app-icon name="home" />Dashboard</span><span><app-icon name="book" />Courses</span
        ><span><app-icon name="user" />Profile</span>
      </div>
      <div class="preview-content">
        <p class="meta">Your class</p>
        <div class="preview-class">
          <app-course-motif title="Arabic" />
          <div>
            <h3>Arabic Language Fundamentals</h3>
            <p class="meta">Your schedule, teacher and room in one place.</p>
          </div>
        </div>
        <p class="meta">Class resources</p>
        <div class="preview-resource">
          <app-icon name="file" /><strong>Lesson</strong><span>Reading practice</span
          ><app-icon name="arrow" />
        </div>
        <div class="preview-resource">
          <app-icon name="file" /><strong>Exercise</strong><span>Practice sheet</span
          ><app-icon name="arrow" />
        </div>
        <div class="preview-resource">
          <app-icon name="link" /><strong>Correction</strong><span>Guided answers</span
          ><app-icon name="arrow" />
        </div>
      </div>
    </div>
  </div>`,
})
export class WorkspacePreview {}
