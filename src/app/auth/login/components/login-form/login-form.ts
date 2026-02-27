import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
  readonly email = signal('');
  readonly password = signal('');
  readonly showPassword = signal(false);

  /** Dışarıya emit edilen login eventi */
  readonly submitLogin = output<{ email: string; password: string }>();

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    const email = this.email().trim();
    const password = this.password().trim();
    if (!email || !password) return;

    this.submitLogin.emit({ email, password });
  }
}
