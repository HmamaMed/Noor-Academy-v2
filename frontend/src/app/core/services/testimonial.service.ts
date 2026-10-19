import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export type TestimonialStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';
export interface PublicTestimonial {
  id: number;
  content: string;
  studentName: string;
  courseTitle: string;
}
export interface Testimonial extends PublicTestimonial {
  enrollmentId: number;
  groupName: string;
  status: TestimonialStatus;
  createdAt: string;
}
export interface TestimonialPage {
  content: Testimonial[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/testimonials`;
  published() {
    return this.http.get<PublicTestimonial[]>(this.url);
  }
  mine() {
    return this.http.get<Testimonial[]>(`${this.url}/mine`);
  }
  submit(enrollmentId: number, content: string, publicConsent: boolean) {
    return this.http.post<Testimonial>(this.url, { enrollmentId, content, publicConsent });
  }
  withdraw(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
  review(status: TestimonialStatus | '', page = 0) {
    return this.http.get<TestimonialPage>(`${this.url}/admin`, {
      params: status ? { status, page } : { page },
    });
  }
  moderate(id: number, status: TestimonialStatus) {
    return this.http.patch<Testimonial>(`${this.url}/${id}/status`, { status });
  }
}
