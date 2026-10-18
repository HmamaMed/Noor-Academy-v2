import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  untracked,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import {
  Material,
  MaterialType,
  Workspace as WorkspaceData,
} from '../../core/models/material.model';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/design/icon';
import { NoorDialog } from '../../shared/design/dialog';
import { ResourceCard } from '../../shared/design/resource-card';
import { StatusBadge } from '../../shared/components/status-badge';
import { ToastService } from '../../core/notifications/toast.service';

@Component({
  selector: 'app-workspace',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    Icon,
    NoorDialog,
    ResourceCard,
    StatusBadge,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.css',
})
export class ClassWorkspace implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly service = inject(WorkspaceService);
  private readonly enrollments = inject(EnrollmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly requests = new Subject<number>();
  private groupId = 0;
  private resolveLeave?: (leave: boolean) => void;
  protected readonly auth = inject(AuthService);
  protected readonly dashboard = computed(() =>
    this.auth.hasRole('ADMIN')
      ? '/admin/groups'
      : this.auth.hasRole('TEACHER')
        ? '/teacher/dashboard'
        : '/student/dashboard',
  );
  protected workspace = signal<WorkspaceData | null>(null);
  protected loading = signal(true);
  protected loadError = signal('');
  protected denied = signal(false);
  protected pending = signal(false);
  protected busy = signal(false);
  protected busyMaterial = signal<number | null>(null);
  protected downloading = signal<number | null>(null);
  protected downloadError = signal<Material | null>(null);
  protected selectedMaterial = signal<Material | null>(null);
  protected removeTarget = signal<Material | null>(null);
  protected removeError = signal('');
  protected success = signal('');
  protected editorOpen = signal(false);
  protected discardOpen = signal(false);
  protected formError = signal('');
  protected filter = signal<MaterialType | 'ALL'>('ALL');
  protected readonly types: MaterialType[] = ['LESSON', 'EXERCISE', 'CORRECTION', 'OTHER'];
  protected readonly isOther = (material: Material) => material.type === 'OTHER';
  protected readonly labels: Record<MaterialType, string> = {
    LESSON: 'Lessons',
    EXERCISE: 'Exercises',
    CORRECTION: 'Corrections',
    OTHER: 'Other',
  };
  protected visible = computed(
    () =>
      this.workspace()?.materials.filter(
        (material) => this.filter() === 'ALL' || material.type === this.filter(),
      ) ?? [],
  );
  protected emptyTitle = computed(() => {
    const type = this.filter();
    return type === 'ALL' ? 'No materials yet.' : `No ${this.labels[type].toLowerCase()} yet.`;
  });
  protected file = signal<File | null>(null);
  protected form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(20000)],
    type: ['LESSON' as MaterialType, Validators.required],
    externalUrl: ['', Validators.maxLength(2000)],
  });

  constructor() {
    for (const source of [this.loadError, this.formError, this.removeError]) {
      effect(() => {
        const message = source();
        if (message) untracked(() => this.toast.error(message));
      });
    }
  }

  ngOnInit() {
    // A single cancellable stream prevents old route/retry responses from exposing stale materials.
    this.requests
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.loadError.set('');
          this.denied.set(false);
          this.pending.set(false);
          this.workspace.set(null);
          this.selectedMaterial.set(null);
          this.downloadError.set(null);
          if (!Number.isSafeInteger(id) || id <= 0) {
            this.loading.set(false);
            this.loadError.set('This class could not be found.');
            return EMPTY;
          }
          return this.service.find(id).pipe(
            catchError((err) => {
              this.loading.set(false);
              if (err.status === 403) {
                this.denied.set(true);
                // Only inspect the current student's own application after the server denies workspace access.
                if (this.auth.hasRole('STUDENT'))
                  this.enrollments
                    .findMine()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                      next: (records) => {
                        if (this.groupId === id && this.denied())
                          this.pending.set(
                            records.some(
                              (item) => item.groupId === id && item.status === 'PENDING',
                            ),
                          );
                      },
                      error: () => {},
                    });
              } else
                this.loadError.set(
                  err.status === 404
                    ? 'This class could not be found.'
                    : 'We couldn’t load your class materials. Try again.',
                );
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        this.workspace.set(data);
        this.loading.set(false);
      });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.groupId = Number(params.get('groupId'));
      this.filter.set('ALL');
      this.success.set('');
      this.editorOpen.set(false);
      this.removeTarget.set(null);
      this.resetForm();
      this.load();
    });
  }
  protected load() {
    this.requests.next(this.groupId);
  }
  private refresh() {
    const id = this.groupId;
    this.service
      .find(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (this.groupId === id) this.workspace.set(data);
        },
        error: (err) => {
          if (this.groupId !== id) return;
          if (err.status === 403) {
            this.workspace.set(null);
            this.denied.set(true);
          } else
            this.toast.error(
              'Could not refresh materials. Reload the workspace to see the current list.',
            );
        },
      });
  }
  protected openEditor() {
    this.resetForm();
    this.editorOpen.set(true);
  }
  private resetForm() {
    this.form.reset({ title: '', description: '', type: 'LESSON', externalUrl: '' });
    this.file.set(null);
    this.formError.set('');
  }
  protected closeEditor() {
    if (this.busy()) return;
    if (this.form.dirty || this.file()) this.discardOpen.set(true);
    else this.editorOpen.set(false);
  }
  canLeave(): boolean | Promise<boolean> {
    if (this.busy() || this.busyMaterial()) return false;
    if (!this.editorOpen() || (!this.form.dirty && !this.file())) return true;
    this.discardOpen.set(true);
    return new Promise((resolve) => (this.resolveLeave = resolve));
  }
  protected resolveDiscard(discard: boolean) {
    this.discardOpen.set(false);
    if (discard) {
      this.editorOpen.set(false);
      this.resetForm();
    }
    this.resolveLeave?.(discard);
    this.resolveLeave = undefined;
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.editorOpen() && (this.form.dirty || this.file())) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  protected chooseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > 25 * 1024 * 1024) {
      this.reportFormError('Choose a file of 25 MB or less.');
      input.value = '';
      this.file.set(null);
      return;
    }
    this.file.set(file);
  }
  protected publish() {
    if (this.busy() || !this.workspace()?.canManage) return;
    this.formError.set('');
    this.success.set('');
    if (this.form.invalid || !this.form.controls.title.value.trim()) {
      this.form.markAllAsTouched();
      this.reportFormError(
        'Enter a title of up to 200 characters and keep material text within 20,000 characters.',
      );
      return;
    }
    const data = this.form.getRawValue();
    if (!data.description.trim() && !data.externalUrl.trim() && !this.file()) {
      this.reportFormError('Add material text, a Google Drive / Docs link, or a file.');
      return;
    }
    if (data.externalUrl.trim()) {
      try {
        const url = new URL(data.externalUrl.trim());
        if (
          url.protocol !== 'https:' ||
          !['drive.google.com', 'docs.google.com'].includes(url.hostname) ||
          url.username ||
          url.password ||
          (url.port && url.port !== '443')
        )
          throw new Error();
      } catch {
        this.form.controls.externalUrl.setErrors({ driveUrl: true });
        this.form.controls.externalUrl.markAsTouched();
        this.reportFormError('Use an HTTPS Google Drive or Google Docs link.');
        return;
      }
    }
    this.busy.set(true);
    this.service
      .create(this.groupId, data, this.file())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.editorOpen.set(false);
          this.resetForm();
          this.success.set('Material published.');
          this.refresh();
        },
        error: (err) => {
          this.busy.set(false);
          this.reportFormError(
            err.error?.message ??
              'Could not publish material. Your changes are still here; try again.',
          );
          if (err.status === 403) this.refresh();
        },
      });
  }
  private reportFormError(message: string) {
    this.formError.set(message);
    setTimeout(() => document.getElementById('material-form-error')?.focus());
  }
  protected read(material: Material) {
    this.selectedMaterial.set(material);
    setTimeout(() => document.getElementById('material-reader')?.focus());
  }
  protected download(material: Material) {
    if (this.downloading() !== null) return;
    this.downloading.set(material.id);
    this.downloadError.set(null);
    this.service
      .download(material.groupId, material.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (download) => {
          const anchor = document.createElement('a');
          anchor.href = download.url;
          anchor.download = material.fileName ?? 'attachment';
          anchor.rel = 'noopener noreferrer';
          anchor.referrerPolicy = 'no-referrer';
          anchor.click();
          this.downloading.set(null);
        },
        error: (err) => {
          this.downloading.set(null);
          this.downloadError.set(material);
          this.toast.error('The attachment could not be downloaded. Please try again.');
          if (err.status === 403) this.refresh();
        },
      });
  }
  protected requestRemove(material: Material) {
    this.removeError.set('');
    this.removeTarget.set(material);
  }
  protected remove() {
    const material = this.removeTarget();
    if (!material || this.busyMaterial() !== null || !this.workspace()?.canManage) return;
    this.busyMaterial.set(material.id);
    this.removeError.set('');
    this.service
      .delete(material.groupId, material.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyMaterial.set(null);
          this.removeTarget.set(null);
          if (this.selectedMaterial()?.id === material.id) this.selectedMaterial.set(null);
          this.success.set('Material removed.');
          this.refresh();
        },
        error: (err) => {
          this.busyMaterial.set(null);
          this.removeError.set(err.error?.message ?? 'Could not remove material. Try again.');
          if (err.status === 403) this.refresh();
        },
      });
  }
}
