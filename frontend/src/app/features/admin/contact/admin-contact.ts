import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ContactInbox,
  ContactMessage,
  ContactService,
} from '../../../core/services/contact.service';
import { NoorDialog } from '../../../shared/design/dialog';
import { Icon } from '../../../shared/design/icon';
import { LocationMap } from '../../../shared/design/location-map';
import { AdminEditor } from '../admin-editor';
import { AdminConfirm } from '../admin-confirm';

@Component({
  selector: 'app-admin-contact',
  imports: [DatePipe, ReactiveFormsModule, NoorDialog, Icon, LocationMap, AdminConfirm],
  templateUrl: './admin-contact.html',
  styleUrls: ['../admin.css', './admin-contact.css'],
})
export class AdminContact extends AdminEditor implements OnInit {
  private readonly contact = inject(ContactService);
  private readonly fb = inject(FormBuilder);
  protected readonly inbox = signal<ContactInbox | null>(null);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly selected = signal<ContactMessage | null>(null);
  protected readonly updating = signal(false);
  protected readonly messageError = signal('');
  protected readonly settingsLoading = signal(false);
  protected readonly footerLoadError = signal('');
  protected override readonly saving = signal(false);
  protected override readonly deleteError = signal('');
  protected override readonly form = this.fb.group(
    {
      email: this.fb.nonNullable.control('', [Validators.email, Validators.maxLength(254)]),
      phone: this.fb.nonNullable.control('', [
        Validators.maxLength(40),
        Validators.pattern(/^[+0-9() .-]*$/),
      ]),
      instagramUrl: this.fb.nonNullable.control('', [
        Validators.maxLength(500),
        Validators.pattern(/^(?:https:\/\/[^\s]+)?$/),
      ]),
      facebookUrl: this.fb.nonNullable.control('', [
        Validators.maxLength(500),
        Validators.pattern(/^(?:https:\/\/[^\s]+)?$/),
      ]),
      whatsappUrl: this.fb.nonNullable.control('', [
        Validators.maxLength(500),
        Validators.pattern(/^(?:https:\/\/[^\s]+)?$/),
      ]),
      locationName: this.fb.nonNullable.control('', Validators.maxLength(160)),
      address: this.fb.nonNullable.control('', Validators.maxLength(300)),
      latitude: this.fb.control<number | null>(null, [Validators.min(-85), Validators.max(85)]),
      longitude: this.fb.control<number | null>(null, [Validators.min(-180), Validators.max(180)]),
    },
    {
      validators: (control: AbstractControl) =>
        (control.get('latitude')?.value === null) === (control.get('longitude')?.value === null)
          ? null
          : { coordinatePair: true },
    },
  );
  protected readonly fields = [
    {
      name: 'email',
      label: 'Public email',
      type: 'email',
      placeholder: 'hello@your-academy.com',
      max: 254,
    },
    { name: 'phone', label: 'Public phone', type: 'tel', placeholder: '+212 …', max: 40 },
    {
      name: 'instagramUrl',
      label: 'Instagram',
      type: 'url',
      placeholder: 'https://www.instagram.com/your-account',
      max: 500,
    },
    {
      name: 'facebookUrl',
      label: 'Facebook',
      type: 'url',
      placeholder: 'https://www.facebook.com/your-page',
      max: 500,
    },
    {
      name: 'whatsappUrl',
      label: 'WhatsApp',
      type: 'url',
      placeholder: 'https://wa.me/212…',
      max: 500,
    },
    {
      name: 'locationName',
      label: 'Location name',
      type: 'text',
      placeholder: 'Noor Academy',
      max: 160,
    },
    {
      name: 'address',
      label: 'Street address',
      type: 'text',
      placeholder: 'Where your classes take place',
      max: 300,
    },
  ];

  ngOnInit() {
    this.load();
  }
  protected load(page = this.page()) {
    if (this.loading()) return;
    this.loading.set(true);
    this.loadError.set('');
    this.contact.inbox(page).subscribe({
      next: (inbox) => {
        this.inbox.set(inbox);
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('We couldn’t load your messages. Please try again.');
      },
    });
  }
  protected openMessage(message: ContactMessage) {
    this.selected.set(message);
    this.messageError.set('');
    if (!message.read) this.setRead(message, true);
  }
  protected setRead(message: ContactMessage, read: boolean) {
    if (this.updating()) return;
    this.updating.set(true);
    this.messageError.set('');
    this.contact.markRead(message.id, read).subscribe({
      next: (updated) => {
        this.updating.set(false);
        if (this.selected()?.id === updated.id) this.selected.set(updated);
        this.inbox.update((inbox) =>
          inbox
            ? {
                ...inbox,
                unreadCount: Math.max(
                  0,
                  inbox.unreadCount + (message.read === updated.read ? 0 : updated.read ? -1 : 1),
                ),
                content: inbox.content.map((item) => (item.id === updated.id ? updated : item)),
              }
            : null,
        );
      },
      error: () => {
        this.updating.set(false);
        this.messageError.set('Couldn’t update this message. Please try again.');
      },
    });
  }
  protected replyUrl(message: ContactMessage) {
    return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent('Re: ' + message.subject)}`;
  }
  protected editFooter() {
    if (this.settingsLoading()) return;
    this.settingsLoading.set(true);
    this.footerLoadError.set('');
    this.contact.loadSettings().subscribe({
      next: (settings) => {
        this.settingsLoading.set(false);
        this.openEditor(() => this.form.reset(settings));
      },
      error: () => {
        this.settingsLoading.set(false);
        this.footerLoadError.set('We couldn’t load the footer settings. Please try again.');
        this.toast.error(this.footerLoadError());
      },
    });
  }
  protected saveFooter() {
    if (this.saving()) return;
    this.formError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set(
        'Check the fields below. Social links must start with https://. Enter both map coordinates, or leave both empty.',
      );
      this.focusError();
      return;
    }
    this.saving.set(true);
    const settings = this.form.getRawValue();
    for (const key of Object.keys(settings) as (keyof typeof settings)[]) {
      if (typeof settings[key] === 'string')
        (settings as Record<string, unknown>)[key] = (settings[key] as string).trim();
    }
    this.contact.updateSettings(settings).subscribe({
      next: () => {
        this.saving.set(false);
        this.finishEditor();
        this.success.set('Footer updated. Your changes are now visible on the website.');
      },
      error: (error) => {
        this.saving.set(false);
        this.formError.set(error.error?.message || 'Couldn’t save the footer. Please try again.');
        this.focusError();
      },
    });
  }
}
