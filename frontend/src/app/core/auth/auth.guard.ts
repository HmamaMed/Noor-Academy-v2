import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../models/user.model';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles = route.data['roles'] as Role[] | undefined;
  if (requiredRoles && !authService.hasRole(...requiredRoles)) {
    return router.createUrlTree(['/']);
  }

  return true;
};
