import { Component, input, output } from '@angular/core';
import { NoorDialog } from '../../shared/design/dialog';
import { Icon } from '../../shared/design/icon';

@Component({
  selector: 'app-admin-confirm',
  imports: [NoorDialog, Icon],
  template: `<app-dialog [label]="title()" [busy]="busy()" (closed)="cancelled.emit()">
    <div class="dialog-heading"><h2>{{ title() }}</h2><button type="button" class="icon-button" aria-label="Close confirmation" [disabled]="busy()" (click)="cancelled.emit()"><app-icon name="close" /></button></div>
    <p class="muted">{{ message() }}</p>
    @if (error()) { <p class="notice notice-error" role="alert" style="margin-top: 1rem">{{ error() }}</p> }
    <div class="form-actions"><button type="button" class="btn-secondary" [disabled]="busy()" (click)="cancelled.emit()">{{ cancelLabel() }}</button><button type="button" class="btn-danger" [disabled]="busy()" (click)="accepted.emit()">{{ busy() ? 'Working…' : acceptLabel() }}</button></div>
  </app-dialog>`,
})
export class AdminConfirm {
  title = input.required<string>();
  message = input.required<string>();
  acceptLabel = input('Delete');
  cancelLabel = input('Keep record');
  busy = input(false);
  error = input('');
  accepted = output<void>();
  cancelled = output<void>();
}
