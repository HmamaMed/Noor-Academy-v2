import { Component, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Brand } from '../../shared/design/brand';
import { Icon } from '../../shared/design/icon';
import { isAdminRole } from '../models/user.model';
import { NoorDialog } from '../../shared/design/dialog';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Brand, Icon, NoorDialog],
  templateUrl: './navbar.html',
})
export class Navbar {
  private router = inject(Router);
  private auth = inject(AuthService);
  appShell = input(false);
  protected user = toSignal(this.auth.currentUser$, { initialValue: this.auth.currentUser });
  protected menuOpen = signal(false);
  protected userName = computed(() => {
    const user = this.user();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || '';
  });
  protected userInitials = computed(() => {
    const user = this.user();
    const initials = [user?.firstName, user?.lastName]
      .map((name) => Array.from(name?.trim() || '')[0] || '')
      .join('');
    return (initials || Array.from(user?.email || '')[0] || '?').toUpperCase();
  });
  protected isAdmin = computed(() => isAdminRole(this.user()?.role));
  protected dashboard = computed(() =>
    this.isAdmin()
      ? '/admin/enrollments'
      : this.user()?.role === 'TEACHER'
        ? '/teacher/dashboard'
        : '/student/dashboard',
  );
  protected links = computed(() =>
    this.isAdmin()
      ? [
          { path: '/admin/enrollments', label: 'Enrollments', icon: 'check' },
          { path: '/admin/groups', label: 'Groups', icon: 'users' },
          { path: '/admin/courses', label: 'Courses', icon: 'book' },
          { path: '/admin/rooms', label: 'Rooms', icon: 'room' },
          { path: '/admin/users', label: 'Users', icon: 'user' },
          { path: '/admin/messages', label: 'Messages', icon: 'mail' },
          { path: '/admin/testimonials', label: 'Testimonials', icon: 'quote' },
        ]
      : [
          { path: this.dashboard(), label: 'Dashboard', icon: 'home' },
          { path: '/courses', label: 'Courses', icon: 'book' },
          { path: '/profile', label: 'Profile', icon: 'user' },
        ],
  );
  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
  protected logout() {
    this.menuOpen.set(false);
    // Resolve any unsaved-change dialog before ending the session.
    this.router.navigate(['/'], { onSameUrlNavigation: 'reload' }).then((left) => {
      if (left) this.auth.logout();
    });
  }
}
