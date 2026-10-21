import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { Enrollment } from '../../core/models/enrollment.model';
import { PaymentService, PaymentSettings } from '../../core/services/payment.service';
import { ContactService } from '../../core/services/contact.service';
import { Icon } from '../design/icon';
import { PaymentReceipt } from './payment-receipt';
import { CourseFacts } from './course-facts';

@Component({
  selector: 'app-enrollment-payment',
  imports: [Icon, PaymentReceipt, CourseFacts],
  templateUrl: './enrollment-payment.html',
  styleUrl: './enrollment-payment.css',
})
export class EnrollmentPayment implements OnInit {
  enrollment = input.required<Enrollment>();
  busyChange = output<boolean>();
  private readonly payments = inject(PaymentService);
  private readonly contact = inject(ContactService);
  protected readonly settings = signal<PaymentSettings | null>(null);
  protected readonly location = this.contact.settings;
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly copied = signal(false);
  protected readonly copyError = signal(false);
  protected readonly payable = computed(
    () =>
      this.enrollment().status === 'PENDING' &&
      (!this.enrollment().expiresAt || Date.parse(this.enrollment().expiresAt!) > Date.now()),
  );
  protected readonly mapUrl = computed(() => {
    const { latitude, longitude, address } = this.location();
    const query =
      latitude !== null && longitude !== null ? `${latitude},${longitude}` : address.trim();
    return query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : null;
  });
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      payment: this.payments.settings(),
      location: this.contact.loadSettings().pipe(catchError(() => of(this.location()))),
    }).subscribe({
      next: (data) => {
        this.settings.set(data.payment);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
  protected async copyRib() {
    this.copyError.set(false);
    try {
      await navigator.clipboard.writeText(this.settings()!.rib);
      this.copied.set(true);
    } catch {
      this.copyError.set(true);
    }
  }
}
