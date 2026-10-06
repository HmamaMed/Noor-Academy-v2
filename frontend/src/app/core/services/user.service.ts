import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models/user.model';

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;

  findAll(role?: Role): Observable<User[]> {
    const params = role ? { role } : undefined;
    return this.http.get<User[]>(this.baseUrl, { params });
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  update(
    id: number,
    request: { firstName: string; lastName: string; phone: string },
  ): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, request);
  }
  me(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`);
  }
  updateMe(request: { firstName: string; lastName: string; phone: string }): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/me`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
