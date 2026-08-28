import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Room, RoomRequest } from '../models/room.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/rooms`;

  findAll(): Observable<Room[]> {
    return this.http.get<Room[]>(this.baseUrl);
  }

  create(request: RoomRequest): Observable<Room> {
    return this.http.post<Room>(this.baseUrl, request);
  }

  update(id: number, request: RoomRequest): Observable<Room> {
    return this.http.put<Room>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
