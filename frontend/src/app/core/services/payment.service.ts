import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PaymentDetails {
  bankName: string;
  accountHolder: string;
  rib: string;
  bankInstructions: string;
  visitInstructions: string;
  openingHours: string;
}
export interface PaymentSettings extends PaymentDetails {
  receiptUploadsEnabled: boolean;
  maxReceiptBytes: number;
}
export interface PaymentReceipt {
  enrollmentId: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/payments`;
  settings() {
    return this.http.get<PaymentSettings>(`${this.url}/settings`);
  }
  saveSettings(details: PaymentDetails) {
    return this.http.put<PaymentSettings>(`${this.url}/settings`, details);
  }
  receipts() {
    return this.http.get<PaymentReceipt[]>(`${this.url}/receipts`);
  }
  receipt(enrollmentId: number) {
    return this.http.get<PaymentReceipt | null>(`${this.url}/enrollments/${enrollmentId}/receipt`);
  }
  uploadReceipt(enrollmentId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<PaymentReceipt>(`${this.url}/enrollments/${enrollmentId}/receipt`, form);
  }
  downloadReceipt(enrollmentId: number) {
    return this.http.get<{ url: string; expiresAt: string }>(
      `${this.url}/enrollments/${enrollmentId}/receipt/download`,
    );
  }
}
