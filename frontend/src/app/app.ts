import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { ToastOutlet } from './core/notifications/toast-outlet';
import { Navbar } from './core/layout/navbar';
import { Footer } from './core/layout/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, ToastOutlet],
  templateUrl: './app.html',
})
export class App {
  private router = inject(Router);
  private url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected appShell = computed(() =>
    /^\/(student|teacher|admin|classroom|profile)(\/|$)/.test(this.url()),
  );
  protected skipTarget = computed(() => this.url().split('#')[0] + '#main-content');
}
