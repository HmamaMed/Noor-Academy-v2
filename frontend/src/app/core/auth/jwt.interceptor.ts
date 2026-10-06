import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = req.url === environment.apiUrl || req.url.startsWith(environment.apiUrl + '/');
  const token = isApi ? auth.token : null;
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req).pipe(
    catchError((err) => {
      if (isApi && err.status === 401 && !req.url.includes('/auth/')) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { redirectTo: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
