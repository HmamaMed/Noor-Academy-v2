import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icon } from './icon';

@Component({
  selector: 'app-location-map',
  imports: [Icon],
  template: `
    @if (mapUrl(); as url) {
      <iframe [src]="url" [title]="label()" loading="lazy" referrerpolicy="no-referrer"></iframe>
    } @else {
      <div class="map-placeholder">
        <span class="map-pin"><app-icon name="pin" /></span
        ><span>Good things happen<br />when we learn together.</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      border-radius: 0.75rem;
      background: #e8eee6;
    }
    iframe {
      display: block;
      width: 100%;
      height: 11rem;
      border: 0;
    }
    .map-placeholder {
      min-height: 11rem;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 0.75rem;
      color: #163d35;
      text-align: center;
      font-size: 0.875rem;
      line-height: 1.4;
      background-image:
        linear-gradient(32deg, transparent 43%, #f9faf5 44%, #f9faf5 48%, transparent 49%),
        linear-gradient(113deg, transparent 52%, #f9faf5 53%, #f9faf5 57%, transparent 58%),
        linear-gradient(0deg, transparent 72%, #d5e0d2 73%, #d5e0d2 74%, transparent 75%);
    }
    .map-pin {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      background: #163d35;
      color: #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 12px #163d3526;
    }
    .map-pin app-icon {
      transform: rotate(45deg);
    }
  `,
})
export class LocationMap {
  latitude = input<number | null>(null);
  longitude = input<number | null>(null);
  label = input('Course location');
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly mapUrl = computed(() => {
    const lat = this.latitude();
    const lon = this.longitude();
    if (
      lat === null ||
      lon === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 85 ||
      Math.abs(lon) > 180
    )
      return null;
    const bbox = [
      Math.max(-180, lon - 0.007),
      lat - 0.004,
      Math.min(180, lon + 0.007),
      lat + 0.004,
    ].join(',');
    // Only validated numeric coordinates enter this fixed OpenStreetMap URL.
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`,
    );
  });
}
