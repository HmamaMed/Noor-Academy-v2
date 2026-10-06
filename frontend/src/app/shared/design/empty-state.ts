import { Component, input } from '@angular/core';
import { Icon } from './icon';
@Component({
 selector: 'app-empty-state', imports: [Icon],
 template: `<div class="empty-state" role="status"><app-icon [name]="icon()"/><h2>{{ title() }}</h2><p>{{ message() }}</p><ng-content /></div>`,
})
export class EmptyState { title = input('Nothing here yet.'); message = input(''); icon = input('book'); }
