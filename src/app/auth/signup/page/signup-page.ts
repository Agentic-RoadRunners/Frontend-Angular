import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SignupForm } from '../components/signup-form/signup-form';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-signup-page',
  imports: [SignupForm, RouterLink],
  templateUrl: './signup-page.html',
  styleUrl: './signup-page.css',
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = this.auth.isLoading;
  error = '';
  success = '';

  onSignup(data: { fullName: string; email: string; password: string }): void {
    this.error = '';
    this.success = '';

    this.auth.signup(data).subscribe({
      next: (res) => {
        this.success = res.message + ' Giriş sayfasına yönlendiriliyorsunuz...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: Error) => {
        this.error = err.message;
      },
    });
  }
}
