import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PaymentService,
  PaymentSettings as Settings,
} from '../../../core/services/payment.service';
import { Icon } from '../../../shared/design/icon';
import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';

@Component({
  selector: 'app-payment-settings',
  imports: [ReactiveFormsModule, RouterLink, Icon, AdminConfirm],
  templateUrl: './payment-settings.html',
  styleUrls: ['../admin.css', './payment-settings.css'],
})
export class PaymentSettings extends AdminEditor implements OnInit {
  private readonly service = inject(PaymentService);
  private readonly fb = inject(FormBuilder);
  protected readonly loading = signal(true);
  protected readonly settings = signal<Settings | null>(null);
  protected override readonly saving = signal(false);
  protected override readonly deleteError = signal('');
  protected override readonly form = this.fb.nonNullable.group(
    {
      bankName: ['', Validators.maxLength(160)],
      accountHolder: ['', Validators.maxLength(160)],
      rib: ['', [Validators.maxLength(80), Validators.pattern(/^[A-Za-z0-9 .-]*$/)]],
      bankInstructions: ['', Validators.maxLength(1000)],
      visitInstructions: ['', Validators.maxLength(1000)],
      openingHours: ['', Validators.maxLength(300)],
    },
    {
      validators: (control) => {
        const fields = ['bankName', 'accountHolder', 'rib'].map((key) =>
          String(control.get(key)?.value || '').trim(),
        );
        return fields.every((value) => !value) || fields.every(Boolean)
          ? null
          : { bankDetails: true };
      },
    },
  );
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.loadError.set('');
    this.service.settings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.form.reset(settings);
        this.editorOpen.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('We couldn’t load payment details. Please try again.');
      },
    });
  }
  protected save() {
    if (this.saving()) return;
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set(
        'Enter the bank name, account holder, and RIB together, or leave all three blank. Check the field limits below.',
      );
      this.focusError();
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const details = {
      bankName: value.bankName.trim(),
      accountHolder: value.accountHolder.trim(),
      rib: value.rib.trim(),
      bankInstructions: value.bankInstructions.trim(),
      visitInstructions: value.visitInstructions.trim(),
      openingHours: value.openingHours.trim(),
    };
    this.service.saveSettings(details).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.form.reset(settings);
        this.saving.set(false);
        this.success.set(
          'Payment instructions saved. Students will see them in their applications.',
        );
      },
      error: (error) => {
        this.saving.set(false);
        this.formError.set(
          error.error?.message || 'We couldn’t save payment details. Please try again.',
        );
        this.focusError();
      },
    });
  }
}
