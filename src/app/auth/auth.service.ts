import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/pagination.model';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(false);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  private readonly loginUrl = `${environment.apiUrl}/auth/login`;
  private readonly registerUrl = `${environment.apiUrl}/auth/register`;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const user = JSON.parse(stored) as AuthUser;
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    }
  }

  login(command: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<AuthResponse>>(this.loginUrl, command).pipe(
      tap({
        next: (res) => {
          if (res.succeeded && res.data) {
            const user: AuthUser = {
              id: res.data.userId,
              email: res.data.email,
              fullName: res.data.fullName ?? '',
              roles: res.data.roles,
            };
            localStorage.setItem('auth_token', res.data.accessToken);
            localStorage.setItem('auth_user', JSON.stringify(user));
            this.currentUser.set(user);
            this.isAuthenticated.set(true);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      }),
    );
  }

  signup(command: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<AuthResponse>>(this.registerUrl, command).pipe(
      tap({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false),
      }),
    );
  }

  async logout(): Promise<boolean> {
    const confirmed = await this.confirmDialog.open({
      theme: 'danger',
      icon: 'fa-sign-out-alt',
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
    });
    if (!confirmed) return false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    return true;
  }
}
