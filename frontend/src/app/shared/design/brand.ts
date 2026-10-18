import { Component, input } from '@angular/core';

export type BrandVariant = 'horizontal' | 'stacked' | 'symbol';

// Reuse the supplied raster without changing its letterforms or stretching it.
// The stacked and symbol variants are SVG viewports, not separate logo masters.

@Component({
  selector: 'app-brand',
  template: `
    <svg
      [attr.viewBox]="variant() === 'stacked' ? '0 0 560 400' : variant() === 'symbol' ? '137 202 320 340' : '137 202 1923 340'"
      role="img" aria-label="Noor Academy" focusable="false"
    >
      @if (variant() === 'stacked') {
        <svg x="160" y="0" width="240" height="256" viewBox="137 202 320 340" aria-hidden="true" overflow="hidden">
          <image [attr.href]="artwork" width="2172" height="724" />
        </svg>
        <svg x="0" y="296" width="560" height="100" viewBox="530 280 1535 268" aria-hidden="true" overflow="hidden">
          <image [attr.href]="artwork" width="2172" height="724" />
        </svg>
      } @else {
        <image [attr.href]="artwork" width="2172" height="724" />
      }
    </svg>
  `,
  styles: `
    :host { width: 14rem; }
    :host(.brand--stacked) { width: 8rem; }
    :host(.brand--symbol) { width: 3.5rem; }
    :host(.brand--inverse) { filter: brightness(0) invert(1); }
    :host > svg { display: block; width: 100%; height: auto; overflow: hidden; }
    @media (max-width: 767px) {
      :host(.brand--horizontal) { width: 11.25rem; }
    }
    @media (max-width: 379px) {
      :host(.brand--horizontal) { width: 10rem; }
    }
  `,
  host: {
    class: 'brand',
    '[class.brand--horizontal]': 'variant() === "horizontal"',
    '[class.brand--stacked]': 'variant() === "stacked"',
    '[class.brand--symbol]': 'variant() === "symbol"',
    '[class.brand--inverse]': 'inverse()',
  },
})
export class Brand {
  readonly variant = input<BrandVariant>('horizontal');
  readonly inverse = input(false);
  protected readonly artwork = '/img/noor-academy-refined-v2.png';
}
