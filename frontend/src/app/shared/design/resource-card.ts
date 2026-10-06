import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Material } from '../../core/models/material.model';
import { Icon } from './icon';

@Component({
  selector: 'app-resource-card',
  imports: [DatePipe, Icon],
  template: `<article class="resource-card" [attr.aria-labelledby]="'resource-' + material().id">
    <span class="resource-icon"
      ><app-icon
        [name]="
          material().type === 'LESSON'
            ? 'book'
            : material().externalUrl && !material().description
              ? 'link'
              : 'file'
        "
    /></span>
    <div class="resource-copy">
      <p class="meta">{{ label() }} · {{ material().createdAt | date: 'd MMM y' }}</p>
      <h3 [id]="'resource-' + material().id">{{ material().title }}</h3>
      <p class="meta resource-author">{{ material().authorName }}</p>
      @if (material().description) {
        <p class="resource-excerpt">{{ material().description }}</p>
      }
      @if (material().hasFile && material().fileName) {
        <p class="meta file-meta">
          {{ material().fileName }}
          @if (material().fileSize !== null) {
            · {{ fileSize() }}
          }
        </p>
      }
    </div>
    <div class="resource-actions">
      @if (material().description) {
        <button
          class="btn-secondary"
          type="button"
          [attr.aria-label]="'Read ' + material().title"
          (click)="read.emit()"
        >
          {{ material().type === 'LESSON' ? 'Read lesson' : 'Read resource'
          }}<app-icon name="arrow" />
        </button>
      }
      @if (material().hasFile) {
        <button
          class="btn-secondary"
          type="button"
          [disabled]="busy()"
          [attr.aria-label]="'Download ' + (material().fileName ?? material().title)"
          (click)="download.emit()"
        >
          {{ downloading() ? 'Downloading…' : 'Download' }}<app-icon name="download" />
        </button>
      }
      @if (material().externalUrl) {
        <a
          class="btn-secondary"
          [href]="material().externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          >Open link<span class="sr-only"> for {{ material().title }} in a new tab</span
          ><app-icon name="link"
        /></a>
      }
      @if (canManage()) {
        <button
          class="text-link remove-action"
          type="button"
          [disabled]="busy()"
          [attr.aria-label]="'Remove ' + material().title"
          (click)="remove.emit()"
        >
          Remove material
        </button>
      }
    </div>
  </article>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .resource-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: start;
        gap: var(--noor-space-24);
        padding: var(--noor-space-24);
        border: 1px solid var(--noor-border);
        border-radius: var(--noor-radius-card);
        background: var(--noor-surface);
      }
      .resource-icon {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        border-radius: var(--noor-radius-control);
        background: var(--noor-background);
        color: var(--noor-primary);
      }
      .resource-copy h3 {
        margin-top: 0.25rem;
        overflow-wrap: anywhere;
      }
      .resource-author,
      .file-meta {
        margin-top: 0.5rem;
        overflow-wrap: anywhere;
      }
      .resource-excerpt {
        color: var(--noor-text-muted);
        margin-top: 0.75rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .resource-actions {
        display: grid;
        gap: 0.5rem;
        max-width: 15rem;
      }
      .resource-actions .btn-secondary {
        font-size: 0.875rem;
      }
      .remove-action {
        color: var(--noor-error);
        justify-content: center;
        font-size: 0.875rem;
      }
      @media (max-width: 767px) {
        .resource-card {
          grid-template-columns: auto minmax(0, 1fr);
          padding: var(--noor-mobile-gutter);
          gap: var(--noor-space-16);
        }
        .resource-actions {
          grid-column: 1/-1;
          max-width: none;
        }
      }
    `,
  ],
})
export class ResourceCard {
  material = input.required<Material>();
  canManage = input(false);
  busy = input(false);
  downloading = input(false);
  read = output<void>();
  download = output<void>();
  remove = output<void>();
  protected label() {
    return { LESSON: 'Lesson', EXERCISE: 'Exercise', CORRECTION: 'Correction', OTHER: 'Other' }[
      this.material().type
    ];
  }
  protected fileSize() {
    const bytes = this.material().fileSize ?? 0;
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.ceil(bytes / 1024)} KB`;
  }
}
