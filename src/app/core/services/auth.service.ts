import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth-response.model';
import { RegisterRequest } from '../models/register-request.model';
import { LoginRequest } from '../models/login-request.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _currentUserSubject = new BehaviorSubject<User | null>(null);
  
  public readonly currentUser$: Observable<User | null> = this._currentUserSubject.asObservable();

  constructor() {
    // Check if there's a valid token on initialization
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      // Token exists and is valid, but we need to restore user data
      // For now, we'll just keep the token. In production, you might want to call a /me endpoint
      const user = this.getUserFromToken(token);
      if (user) {
        this._currentUserSubject.next(user);
      }
    } else if (token) {
      // Token exists but is expired
      this.clearAuth();
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, request)
      .pipe(
        tap(response => {
          this.setAuthToken(response.token);
          this.setCurrentUser(response);
        })
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, request)
      .pipe(
        tap(response => {
          this.setAuthToken(response.token);
          this.setCurrentUser(response);
        })
      );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  getCurrentUser(): User | null {
    return this._currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private setCurrentUser(authResponse: AuthResponse): void {
    const user: User = {
      id: authResponse.userId,
      email: authResponse.email,
      name: authResponse.name
    };
    this._currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('authToken');
    this._currentUserSubject.next(null);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload.exp) {
        return true;
      }
      // JWT exp is in seconds, Date.now() is in milliseconds
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate <= new Date();
    } catch (error) {
      return true;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload = this.decodeToken(token);
      return {
        id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub,
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email,
        name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.name
      };
    } catch (error) {
      return null;
    }
  }
}
