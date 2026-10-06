import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';
@Component({
 selector: 'app-dialog',
 template: `<dialog #dialog [attr.aria-label]="label()" [class.drawer-dialog]="drawer()" (cancel)="onCancel($event)" (click)="onBackdrop($event)"><div class="dialog-content"><ng-content /></div></dialog>`,
})
export class NoorDialog implements AfterViewInit, OnDestroy {
 label = input.required<string>(); drawer = input(false); busy = input(false); closed = output<void>();
 private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
 private trigger = document.activeElement as HTMLElement | null;
 ngAfterViewInit() { this.dialog().nativeElement.showModal(); }
 ngOnDestroy() { this.dialog().nativeElement.close(); this.trigger?.focus(); }
 onCancel(event: Event) { event.preventDefault(); if (!this.busy()) this.closed.emit(); }
 onBackdrop(event: MouseEvent) { if (event.target === this.dialog().nativeElement && !this.busy()) this.closed.emit(); }
}
