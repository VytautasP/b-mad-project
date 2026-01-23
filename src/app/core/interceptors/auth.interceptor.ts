import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  
  // Clone request and add authorization header if token exists and is valid
  if (token && !authService.isTokenExpired(token)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (token && authService.isTokenExpired(token)) {
    // Token is expired, logout and redirect
    authService.logout();
  }
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authService.logout();
        router.navigate(['/login'], { 
          queryParams: { message: 'Session expired, please log in again' }
        });
      }
      return throwError(() => error);
    })
  );
};
