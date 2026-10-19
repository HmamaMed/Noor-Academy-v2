import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FooterSettings {
  email: string;
  phone: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappUrl: string;
  locationName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}
export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}
export interface ContactMessage extends ContactRequest {
  id: number;
  read: boolean;
  createdAt: string;
}
export interface ContactInbox {
  content: ContactMessage[];
  totalElements: number;
  totalPages: number;
  unreadCount: number;
}
export const emptyFooterSettings: FooterSettings = {
  email: '',
  phone: '',
  instagramUrl: '',
  facebookUrl: '',
  whatsappUrl: '',
  locationName: '',
  address: '',
  latitude: null,
  longitude: null,
};

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/contact`;
  readonly settings = signal<FooterSettings>(emptyFooterSettings);
  loadSettings() {
    return this.http
      .get<FooterSettings>(`${this.baseUrl}/settings`)
      .pipe(tap((settings) => this.settings.set(settings)));
  }
  updateSettings(settings: FooterSettings) {
    return this.http
      .put<FooterSettings>(`${this.baseUrl}/settings`, settings)
      .pipe(tap((saved) => this.settings.set(saved)));
  }
  send(message: ContactRequest) {
    return this.http.post<void>(`${this.baseUrl}/messages`, message);
  }
  inbox(page = 0) {
    return this.http.get<ContactInbox>(`${this.baseUrl}/messages`, { params: { page } });
  }
  markRead(id: number, read: boolean) {
    return this.http.patch<ContactMessage>(`${this.baseUrl}/messages/${id}`, { read });
  }
}
