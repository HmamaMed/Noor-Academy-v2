import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoorDialog } from './dialog';
import { ToastOutlet } from '../../core/notifications/toast-outlet';
import { ToastService } from '../../core/notifications/toast.service';
import { AdminCourses } from '../../features/admin/courses/admin-courses';
import { CourseService } from '../../core/services/course.service';
import { of, throwError } from 'rxjs';

@Component({
  imports: [NoorDialog, ToastOutlet],
  template: `<button id="trigger" (click)="open.set(true)">Edit course</button>
    @if (open()) {
      <app-dialog label="Edit course" [wide]="true" [busy]="busy()" (closed)="open.set(false)"
        ><input aria-label="Title" value="Keep my changes"
      /></app-dialog>
    }
    <app-toast-outlet />`,
})
class Host {
  open = signal(false);
  busy = signal(false);
}

describe('Modal editor and toast placement', () => {
  const originalMethods = new Map<string, PropertyDescriptor | undefined>();
  beforeEach(() => {
    for (const [name, open] of [
      ['showModal', true],
      ['close', false],
    ] as const) {
      originalMethods.set(name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name));
      Object.defineProperty(HTMLDialogElement.prototype, name, {
        configurable: true,
        writable: true,
        value: vi.fn(function (this: HTMLDialogElement) {
          this.open = open;
        }),
      });
    }
    TestBed.configureTestingModule({ imports: [Host] });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    for (const [name, descriptor] of originalMethods) {
      if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
    }
  });
  it('opens a named wide modal, places errors inside its top layer, and restores focus on Escape', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(dialog.classList.contains('wide-dialog')).toBe(true);
    TestBed.inject(ToastService).error('Could not save.');
    fixture.detectChanges();
    expect(dialog.querySelector('.toast')?.textContent).toContain('Could not save.');
    expect(fixture.nativeElement.querySelectorAll('.toast')).toHaveLength(1);
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    fixture.componentInstance.busy.set(false);
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(TestBed.inject(ToastService).activeContext()).toBeNull();
  });
  it('uses a modal for the real course form and retains edits after failed save or cancelled discard', () => {
    const service = {
      findAll: vi.fn(() => of([])),
      imageSettings: vi.fn(() =>
        of({ uploadsEnabled: false, maxBytes: 5242880, maxDimension: 4096 }),
      ),
      create: vi.fn(() => throwError(() => ({ error: { message: 'Course could not be saved.' } }))),
    };
    TestBed.configureTestingModule({
      imports: [AdminCourses],
      providers: [{ provide: CourseService, useValue: service }],
    });
    const fixture = TestBed.createComponent(AdminCourses);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.startCreate();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('dialog[aria-label="Create course"] form'),
    ).not.toBeNull();
    component['form'].patchValue({ title: 'Keep this course' });
    component['form'].markAsDirty();
    component.submit();
    fixture.detectChanges();
    expect(component['editorOpen']()).toBe(true);
    expect(fixture.nativeElement.querySelector('dialog .toast')?.textContent).toContain(
      'Course could not be saved.',
    );
    component['closeEditor']();
    fixture.detectChanges();
    let dialogs = fixture.nativeElement.querySelectorAll('dialog');
    expect(dialogs).toHaveLength(2);
    dialogs[1].dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(component['form'].controls.title.value).toBe('Keep this course');
    expect(fixture.nativeElement.querySelectorAll('dialog')).toHaveLength(1);
    component['closeEditor']();
    fixture.detectChanges();
    dialogs = fixture.nativeElement.querySelectorAll('dialog');
    (dialogs[1].querySelector('.btn-danger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component['editorOpen']()).toBe(false);
    expect(TestBed.inject(ToastService).activeContext()).toBeNull();
  });
});
