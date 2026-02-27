import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangePasswordRequest } from '../../../../models/user.model';

@Component({
  selector: 'app-change-password-form',
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-form.html',
  styleUrl: './change-password-form.css',
})
export class ChangePasswordForm {
  @Input() saving = false;
  @Output() save = new EventEmitter<ChangePasswordRequest>();

  private readonly fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  showCurrent = false;
  showNew = false;

  get passwordMismatch(): boolean {
    return this.form.value.newPassword !== this.form.value.confirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch) return;
    this.save.emit({
      currentPassword: this.form.value.currentPassword,
      newPassword: this.form.value.newPassword,
    });
  }
}
