import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only attach auth header to our own backend — skip external APIs (e.g. OSRM)
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = localStorage.getItem('auth_token');
  const router = inject(Router);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // Token expired or invalid — clear session and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          router.navigate(['/login']);
        }
        return throwError(() => err);
      }),
    );
  }

  return next(req);
};
