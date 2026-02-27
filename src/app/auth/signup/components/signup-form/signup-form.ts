import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-form',
  imports: [FormsModule],
  templateUrl: './signup-form.html',
  styleUrl: './signup-form.css',
})
export class SignupForm {
  readonly fullName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);

  readonly submitSignup = output<{ fullName: string; email: string; password: string }>();

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  get passwordsMatch(): boolean {
    return this.password() === this.confirmPassword();
  }

  get isFormValid(): boolean {
    return (
      !!this.fullName().trim() &&
      !!this.email().trim() &&
      !!this.password().trim() &&
      this.password().length >= 6 &&
      this.passwordsMatch
    );
  }

  onSubmit(): void {
    if (!this.isFormValid) return;

    this.submitSignup.emit({
      fullName: this.fullName().trim(),
      email: this.email().trim(),
      password: this.password(),
    });
  }
}
