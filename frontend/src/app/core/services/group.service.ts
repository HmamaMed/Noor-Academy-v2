import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Group, GroupRequest, GroupStatus } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/groups`;

  findAll(teacherId?: number): Observable<Group[]> {
    const params = teacherId ? { teacherId } : undefined;
    return this.http.get<Group[]>(this.baseUrl, { params });
  }

  findById(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.baseUrl}/${id}`);
  }

  create(request: GroupRequest): Observable<Group> {
    return this.http.post<Group>(this.baseUrl, request);
  }

  update(id: number, request: GroupRequest): Observable<Group> {
    return this.http.put<Group>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, status: GroupStatus): Observable<Group> {
    return this.http.patch<Group>(`${this.baseUrl}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
