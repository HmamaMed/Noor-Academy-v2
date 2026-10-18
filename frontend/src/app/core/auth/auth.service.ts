import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { Role, User, isAdminRole } from '../models/user.model';

const TOKEN_KEY = 'noor_academy_token';
const USER_KEY = 'noor_academy_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(encoded));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser;
    return (
      !!user &&
      roles.some((role) => (role === 'ADMIN' ? isAdminRole(user.role) : role === user.role))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }

  updateStoredUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!this.isAuthenticated) return null;
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
