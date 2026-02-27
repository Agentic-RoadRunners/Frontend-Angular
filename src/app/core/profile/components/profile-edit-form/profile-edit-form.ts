import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfileResponse, UpdateProfileRequest } from '../../../../models/user.model';

@Component({
  selector: 'app-profile-edit-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-edit-form.html',
  styleUrl: './profile-edit-form.css',
})
export class ProfileEditForm implements OnInit {
  @Input({ required: true }) profile!: UserProfileResponse;
  @Input() saving = false;
  @Output() save = new EventEmitter<UpdateProfileRequest>();

  private readonly fb = inject(FormBuilder);
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: [this.profile.fullName ?? '', [Validators.required, Validators.minLength(2)]],
      avatarUrl: [this.profile.avatarUrl ?? ''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.value as UpdateProfileRequest);
  }
}
