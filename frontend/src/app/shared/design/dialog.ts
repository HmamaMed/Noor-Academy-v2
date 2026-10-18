import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ToastOutlet } from '../../core/notifications/toast-outlet';
import { ToastService } from '../../core/notifications/toast.service';

@Component({
  selector: 'app-dialog',
  imports: [ToastOutlet],
  template: `<dialog
    #dialog
    [attr.aria-label]="label()"
    [class.drawer-dialog]="drawer()"
    [class.wide-dialog]="wide() && !drawer()"
    (cancel)="onCancel($event)"
    (click)="onBackdrop($event)"
  >
    <div class="dialog-content"><ng-content /></div>
    <app-toast-outlet [context]="toastContext" />
  </dialog>`,
  styles: `
    dialog.wide-dialog {
      max-width: min(calc(100% - 2.5rem), 56rem);
    }
  `,
})
export class NoorDialog implements OnInit, AfterViewInit, OnDestroy {
  label = input.required<string>();
  drawer = input(false);
  wide = input(false);
  busy = input(false);
  closed = output<void>();
  protected readonly toastContext = {};
  private readonly toast = inject(ToastService);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private trigger = document.activeElement as HTMLElement | null;

  ngOnInit() {
    this.toast.attachModal(this.toastContext);
  }
  ngAfterViewInit() {
    this.dialog().nativeElement.showModal();
  }
  ngOnDestroy() {
    this.toast.detachModal(this.toastContext);
    this.dialog().nativeElement.close();
    this.trigger?.isConnected && this.trigger.focus();
  }
  onCancel(event: Event) {
    event.preventDefault();
    if (!this.busy()) this.closed.emit();
  }
  onBackdrop(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement && !this.busy()) this.closed.emit();
  }
}
