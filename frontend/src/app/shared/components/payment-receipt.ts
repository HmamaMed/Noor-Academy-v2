import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { Enrollment } from '../../core/models/enrollment.model';
import { PaymentReceipt as Receipt, PaymentService } from '../../core/services/payment.service';
import { Icon } from '../design/icon';

@Component({
  selector: 'app-payment-receipt',
  imports: [DatePipe, Icon],
  templateUrl: './payment-receipt.html',
  styleUrl: './payment-receipt.css',
})
export class PaymentReceipt {
  enrollment = input.required<Enrollment>();
  allowUpload = input(false);
  uploadsEnabled = input(false);
  busyChange = output<boolean>();
  private readonly payments = inject(PaymentService);
  protected readonly receipt = signal<Receipt | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly downloading = signal(false);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly fileId = computed(() => `payment-receipt-${this.enrollment().id}`);
  protected readonly canUpload = computed(
    () =>
      this.allowUpload() &&
      this.uploadsEnabled() &&
      this.enrollment().status === 'PENDING' &&
      (!this.enrollment().expiresAt || Date.parse(this.enrollment().expiresAt!) > Date.now()),
  );
  constructor() {
    effect((onCleanup) => {
      const id = this.enrollment().id;
      this.selectedFile.set(null);
      this.receipt.set(null);
      this.error.set('');
      this.success.set('');
      this.loading.set(true);
      this.loadFailed.set(false);
      const subscription = this.payments.receipt(id).subscribe({
        next: (receipt) => {
          this.receipt.set(receipt);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
  protected retry() {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.payments.receipt(this.enrollment().id).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }
  protected fileChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.choose(input.files);
    input.value = '';
  }
  protected drop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.choose(event.dataTransfer?.files ?? null);
  }
  protected dragOver(event: DragEvent) {
    event.preventDefault();
    if (this.canUpload() && !this.uploading()) this.dragging.set(true);
  }
  private choose(files: FileList | null) {
    if (!this.canUpload() || this.uploading() || !files?.length) return;
    this.error.set('');
    this.success.set('');
    if (files.length !== 1) {
      this.error.set('Choose one receipt at a time.');
      return;
    }
    const file = files[0];
    if (
      !file.size ||
      file.size > 5 * 1024 * 1024 ||
      !/\.(pdf|jpe?g|png)$/i.test(file.name) ||
      (file.type && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
    ) {
      this.error.set('Choose a PDF, JPG, or PNG receipt up to 5 MB.');
      return;
    }
    this.selectedFile.set(file);
  }
  protected upload() {
    const file = this.selectedFile();
    if (!file || !this.canUpload() || this.uploading() || this.loadFailed()) return;
    this.uploading.set(true);
    this.busyChange.emit(true);
    this.error.set('');
    this.success.set('');
    this.payments.uploadReceipt(this.enrollment().id, file).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.selectedFile.set(null);
        this.uploading.set(false);
        this.busyChange.emit(false);
        this.success.set(
          'Receipt received. Our team will verify the transfer before confirming your place.',
        );
      },
      error: (error) => {
        this.uploading.set(false);
        this.busyChange.emit(false);
        this.error.set(
          error.error?.message ||
            'Upload failed. Your selected file is still here. Please try again.',
        );
      },
    });
  }
  protected download() {
    if (!this.receipt() || this.downloading()) return;
    this.downloading.set(true);
    this.error.set('');
    this.payments.downloadReceipt(this.enrollment().id).subscribe({
      next: (link) => {
        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.download = this.receipt()!.fileName;
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        this.downloading.set(false);
      },
      error: () => {
        this.downloading.set(false);
        this.error.set('The receipt could not be downloaded. Please try again.');
      },
    });
  }
}
