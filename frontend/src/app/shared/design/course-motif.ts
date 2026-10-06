import { Component, computed, input } from '@angular/core';
@Component({
 selector: 'app-course-motif',
 template: `<span class="motif-shape"></span><span class="motif-arch"></span><span class="motif-sun"></span><span class="motif-step"></span>`,
 host: { class: 'course-motif', '[attr.data-motif]': 'variant()', 'aria-hidden': 'true' },
})
export class CourseMotif {
 title = input('');
 protected variant = computed(() => {
   const title = this.title().toLowerCase();
   if (title.includes('arabic')) return 'ribbon';
   if (title.includes('islamic')) return 'steps';
   if (title.includes('tajweed')) return 'rings';
   return 'arch';
 });
}
