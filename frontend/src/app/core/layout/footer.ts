import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand } from '../../shared/design/brand';
@Component({
 selector: 'app-footer', imports: [RouterLink, Brand],
 template: `<footer class="site-footer"><div class="public-container footer-inner"><a routerLink="/" aria-label="Noor Academy home"><app-brand variant="symbol" /></a><nav aria-label="Footer"><a routerLink="/courses">Courses</a><a routerLink="/" fragment="enrollment">How enrollment works</a><a routerLink="/login">Sign in</a></nav><span class="meta">Clear guidance. Thoughtful learning.</span></div></footer>`,
})
export class Footer {}
