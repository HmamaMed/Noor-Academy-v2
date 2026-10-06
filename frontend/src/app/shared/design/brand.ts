import { Component } from '@angular/core';
@Component({
 selector: 'app-brand',
 template: `<span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 48 36" fill="none"><path d="M6 27a18 18 0 0 1 36 0" stroke="var(--noor-accent)" stroke-width="1.75"/><path d="M1 34h46" stroke="currentColor" stroke-width="2"/></svg></span><span>noor academy</span>`,
 host: { class: 'brand' },
})
export class Brand {}
