import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Brand } from '../../shared/design/brand';
import { Icon } from '../../shared/design/icon';
import { NoorDialog } from '../../shared/design/dialog';
import { LocationMap } from '../../shared/design/location-map';
import { ContactService } from '../services/contact.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Brand, Icon, NoorDialog, ReactiveFormsModule, LocationMap],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  private readonly contact = inject(ContactService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  protected readonly settings = this.contact.settings;
  protected readonly year = new Date().getFullYear();
  protected readonly contactOpen = signal(false);
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal('');
  protected readonly socials = computed(() =>
    [
      { label: 'Instagram', icon: 'instagram', url: this.settings().instagramUrl },
      { label: 'Facebook', icon: 'facebook', url: this.settings().facebookUrl },
      { label: 'WhatsApp', icon: 'whatsapp', url: this.settings().whatsappUrl },
    ].filter((social) => social.url),
  );
  protected readonly directionsUrl = computed(() => {
    const { latitude, longitude } = this.settings();
    return latitude === null || longitude === null
      ? null
      : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  });
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    subject: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/\S/)]],
    message: ['', [Validators.required, Validators.maxLength(5000), Validators.pattern(/\S/)]],
  });
  ngOnInit() {
    this.contact.loadSettings().subscribe({
      error: () => {
        /* Keep the contact form available if settings cannot load. */
      },
    });
  }
  protected openContact() {
    if (!this.form.dirty) {
      const user = this.auth.currentUser;
      this.form.patchValue({
        name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
        email: user?.email || '',
      });
    }
    this.contactOpen.set(true);
  }
  protected invalid(field: keyof typeof this.form.controls) {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
  protected submit() {
    if (this.sending()) return;
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please check the highlighted fields.');
      this.focusError();
      return;
    }
    this.sending.set(true);
    const value = this.form.getRawValue();
    this.contact
      .send({
        name: value.name.trim(),
        email: value.email.trim(),
        subject: value.subject.trim(),
        message: value.message.trim(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.sent.set(true);
          this.form.reset();
          setTimeout(() => document.getElementById('contact-success')?.focus());
        },
        error: (error) => {
          this.sending.set(false);
          this.error.set(
            error.error?.message || 'We couldn’t send your message. Please try again.',
          );
          this.focusError();
        },
      });
  }
  protected closeContact() {
    if (this.sending()) return;
    this.contactOpen.set(false);
    this.sent.set(false);
    this.error.set('');
  }
  private focusError() {
    setTimeout(() => document.getElementById('contact-error')?.focus());
  }
}
