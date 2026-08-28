import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Enrollment, EnrollmentStatus } from '../models/enrollment.model';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/enrollments`;

  apply(groupId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(this.baseUrl, { groupId });
  }

  findMine(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.baseUrl}/me`);
  }

  findByGroup(groupId: number, status?: EnrollmentStatus): Observable<Enrollment[]> {
    const params: Record<string, string | number> = { groupId };
    if (status) {
      params['status'] = status;
    }
    return this.http.get<Enrollment[]>(this.baseUrl, { params });
  }

  confirm(id: number): Observable<Enrollment> {
    return this.http.patch<Enrollment>(`${this.baseUrl}/${id}/confirm`, {});
  }

  cancel(id: number): Observable<Enrollment> {
    return this.http.patch<Enrollment>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
