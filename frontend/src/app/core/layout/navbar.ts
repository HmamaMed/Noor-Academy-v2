import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './navbar.html',
})
export class Navbar {
  private router = inject(Router);
  protected authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
