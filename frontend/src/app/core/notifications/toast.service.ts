import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export interface Toast {
  kind: 'error' | 'success';
  id: number;
  message: string;
}

type PauseReason = 'pointer' | 'focus';
interface ToastTimer {
  handle?: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
  paused: Set<PauseReason>;
}

const DURATION = 8000;
const MAX_VISIBLE = 4;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<Toast[]>([]);
  readonly messages = this.state.asReadonly();
  private readonly timers = new Map<number, ToastTimer>();
  private nextId = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((timer) => clearTimeout(timer.handle));
      this.timers.clear();
    });
  }

  error(value: unknown): void { this.show(value, 'error'); }

  success(message: string): void { this.show(message, 'success'); }

  private show(value: unknown, kind: Toast['kind']): void {
    const message =
      typeof value === 'string' && value.trim()
        ? value.trim()
        : 'An unexpected error occurred. Please try again.';
    const existing = this.messages().find((toast) => toast.message === message && toast.kind === kind);
    if (existing) {
      const timer = this.timers.get(existing.id)!;
      clearTimeout(timer.handle);
      timer.remaining = DURATION;
      if (timer.paused.size === 0) this.start(existing.id, timer);
      return;
    }
    if (this.messages().length >= MAX_VISIBLE) this.dismiss(this.messages()[0].id);
    const id = ++this.nextId;
    this.state.update((messages) => [...messages, { id, message, kind }]);
    const timer: ToastTimer = { remaining: DURATION, startedAt: 0, paused: new Set() };
    this.timers.set(id, timer);
    this.start(id, timer);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id)?.handle);
    this.timers.delete(id);
    this.state.update((messages) => messages.filter((toast) => toast.id !== id));
  }

  pause(id: number, reason: PauseReason): void {
    const timer = this.timers.get(id);
    if (!timer || timer.paused.has(reason)) return;
    if (timer.paused.size === 0) {
      clearTimeout(timer.handle);
      timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    }
    timer.paused.add(reason);
  }

  resume(id: number, reason: PauseReason): void {
    const timer = this.timers.get(id);
    if (!timer || !timer.paused.delete(reason) || timer.paused.size > 0) return;
    this.start(id, timer);
  }

  private start(id: number, timer: ToastTimer): void {
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
  }
}
