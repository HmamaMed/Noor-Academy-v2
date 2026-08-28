import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  protected links = [
    { path: 'courses', label: 'Courses' },
    { path: 'groups', label: 'Groups' },
    { path: 'rooms', label: 'Rooms' },
    { path: 'enrollments', label: 'Enrollments' },
    { path: 'users', label: 'Users' },
  ];
}
