import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginForm } from '../components/login-form/login-form';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login-page',
  imports: [LoginForm, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = this.auth.isLoading;
  readonly errorMessage = '';
  error = '';

  onLogin(credentials: { email: string; password: string }): void {
    this.error = '';
    this.auth.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err: Error) => {
        this.error = err.message;
      },
    });
  }
}
