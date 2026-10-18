import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastService } from './toast.service';

describe('Error toast lifecycle', () => {
  let toast: ToastService;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    toast = TestBed.inject(ToastService);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('keeps repeated failures in one toast and refreshes the reading time', () => {
    toast.error('Could not save.');
    const id = toast.messages()[0].id;
    vi.advanceTimersByTime(6000);
    toast.error('Could not save.');
    expect(toast.messages()).toEqual([{ id, message: 'Could not save.', kind: 'error' }]);
    vi.advanceTimersByTime(7999);
    expect(toast.messages()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.messages()).toHaveLength(0);
  });

  it('does not expire while either mouse hover or keyboard focus remains', () => {
    toast.error('Please try again.');
    const id = toast.messages()[0].id;
    vi.advanceTimersByTime(3000);
    toast.pause(id, 'pointer');
    toast.pause(id, 'focus');
    vi.advanceTimersByTime(20000);
    toast.resume(id, 'pointer');
    vi.advanceTimersByTime(20000);
    expect(toast.messages()).toHaveLength(1);
    toast.resume(id, 'focus');
    vi.advanceTimersByTime(4999);
    expect(toast.messages()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.messages()).toHaveLength(0);
  });

  it('can dismiss errors independently and bounds a burst of failures', () => {
    for (let index = 0; index < 6; index++) toast.error(`Failure ${index}`);
    expect(toast.messages().map((t) => t.message)).toEqual([
      'Failure 2',
      'Failure 3',
      'Failure 4',
      'Failure 5',
    ]);
    toast.dismiss(toast.messages()[1].id);
    expect(toast.messages().map((t) => t.message)).toEqual(['Failure 2', 'Failure 4', 'Failure 5']);
    vi.advanceTimersByTime(8000);
    expect(toast.messages()).toHaveLength(0);
  });
  it('routes feedback to the topmost modal and returns to the prior outlet on close', () => {
    const editor = {},
      confirmation = {};
    toast.attachModal(editor);
    toast.error('Could not save.');
    const id = toast.messages()[0].id;
    toast.pause(id, 'pointer');
    toast.attachModal(confirmation);
    expect(toast.activeContext()).toBe(confirmation);
    toast.detachModal(confirmation);
    expect(toast.activeContext()).toBe(editor);
    toast.detachModal(editor);
    expect(toast.activeContext()).toBeNull();
    vi.advanceTimersByTime(8000);
    expect(toast.messages()).toHaveLength(0);
  });
});
