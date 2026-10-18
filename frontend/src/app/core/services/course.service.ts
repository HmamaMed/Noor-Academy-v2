import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course, CourseRequest, CourseImageSettings } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/courses`;

  findAll(): Observable<Course[]> {
    return this.http.get<Course[]>(this.baseUrl);
  }

  findById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/${id}`);
  }

  imageSettings(): Observable<CourseImageSettings> {
    return this.http.get<CourseImageSettings>(`${this.baseUrl}/image-settings`);
  }

  create(request: CourseRequest, image: File | null = null): Observable<Course> {
    return this.http.post<Course>(
      this.baseUrl,
      image ? this.multipart(request, image, false) : request,
    );
  }

  update(
    id: number,
    request: CourseRequest,
    image: File | null = null,
    removeImage = false,
  ): Observable<Course> {
    return this.http.put<Course>(
      `${this.baseUrl}/${id}`,
      image || removeImage ? this.multipart(request, image, removeImage) : request,
    );
  }

  private multipart(request: CourseRequest, image: File | null, removeImage: boolean): FormData {
    const data = new FormData();
    data.append('metadata', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (image) data.append('image', image);
    if (removeImage) data.append('removeImage', 'true');
    return data;
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
