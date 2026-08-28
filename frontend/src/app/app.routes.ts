import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/public/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'courses/:id',
    loadComponent: () =>
      import('./features/public/course-details/course-details').then((m) => m.CourseDetails),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'student/dashboard',
    canActivate: [authGuard],
    data: { roles: ['STUDENT'] },
    loadComponent: () =>
      import('./features/student/dashboard/student-dashboard').then((m) => m.StudentDashboard),
  },
  {
    path: 'teacher/dashboard',
    canActivate: [authGuard],
    data: { roles: ['TEACHER'] },
    loadComponent: () =>
      import('./features/teacher/dashboard/teacher-dashboard').then((m) => m.TeacherDashboard),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () => import('./features/admin/layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'courses', pathMatch: 'full' },
      {
        path: 'courses',
        loadComponent: () =>
          import('./features/admin/courses/admin-courses').then((m) => m.AdminCourses),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/admin/groups/admin-groups').then((m) => m.AdminGroups),
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./features/admin/rooms/admin-rooms').then((m) => m.AdminRooms),
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./features/admin/enrollments/admin-enrollments').then((m) => m.AdminEnrollments),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/admin-users').then((m) => m.AdminUsers),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
