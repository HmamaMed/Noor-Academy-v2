export type Role = 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT';

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function roleLabel(role: Role | null | undefined): string {
  return isAdminRole(role)
    ? 'Admin'
    : role === 'TEACHER'
      ? 'Teacher'
      : role === 'STUDENT'
        ? 'Student'
        : '';
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
}
