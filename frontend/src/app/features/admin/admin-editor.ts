import { Directive, HostListener, Signal, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/** Shared state for the existing administrative record forms. */
@Directive()
export abstract class AdminEditor {
  protected abstract form: AbstractControl;
  protected abstract saving: Signal<boolean>;
  protected editorOpen = signal(false);
  protected discardAction = signal<(() => void) | null>(null);
  protected formError = signal('');
  protected loadError = signal('');
  protected success = signal('');
  protected deleting = signal(false);
  private editorTrigger: HTMLElement | null = null;
  private resolveLeave?: (leave: boolean) => void;

  protected openEditor(action: () => void): void {
    const open = () => {
      this.editorTrigger = document.activeElement as HTMLElement | null;
      action();
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.formError.set('');
      this.editorOpen.set(true);
      setTimeout(() => document.getElementById('record-editor-title')?.focus());
    };
    if (this.editorOpen() && this.form.dirty) this.discardAction.set(open);
    else open();
  }

  protected closeEditor(): void {
    if (this.form.dirty) this.discardAction.set(() => this.finishEditor());
    else this.finishEditor();
  }

  protected finishEditor(): void {
    this.editorOpen.set(false);
    this.form.markAsPristine();
    this.formError.set('');
    setTimeout(() => this.editorTrigger?.isConnected && this.editorTrigger.focus());
  }

  protected discardChanges(): void {
    const action = this.discardAction();
    this.discardAction.set(null);
    action?.();
  }

  canLeave(): boolean | Promise<boolean> {
    if (this.saving() || this.deleting()) return false;
    if (!this.editorOpen() || !this.form.dirty) return true;
    this.discardAction.set(() => {
      this.form.markAsPristine();
      this.resolveLeave?.(true);
      this.resolveLeave = undefined;
    });
    return new Promise((resolve) => (this.resolveLeave = resolve));
  }

  protected keepEditing(): void {
    this.discardAction.set(null);
    this.resolveLeave?.(false);
    this.resolveLeave = undefined;
  }

  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent): void {
    if (this.editorOpen() && this.form.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected invalid(name: string): boolean {
    const field = this.form.get(name);
    return !!field && field.invalid && field.touched;
  }

  protected focusError(): void {
    setTimeout(() => document.getElementById('record-form-error')?.focus());
  }
}
