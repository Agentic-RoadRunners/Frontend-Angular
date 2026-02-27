import { Component, OnInit, inject, signal } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../../../auth/auth.service';
import { UserProfileResponse, UserStatsResponse, UpdateProfileRequest, ChangePasswordRequest } from '../../../models/user.model';
import { ProfileHeader } from '../components/profile-header/profile-header';
import { ProfileStats } from '../components/profile-stats/profile-stats';
import { ProfileEditForm } from '../components/profile-edit-form/profile-edit-form';
import { ChangePasswordForm } from '../components/change-password-form/change-password-form';

@Component({
  selector: 'app-profile-page',
  imports: [ProfileHeader, ProfileStats, ProfileEditForm, ChangePasswordForm],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);

  readonly profile = signal<UserProfileResponse | null>(null);
  readonly stats = signal<UserStatsResponse | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.profile.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });

    this.profileService.getMyStats().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.stats.set(res.data);
        }
      },
    });
  }

  onProfileSave(req: UpdateProfileRequest): void {
    this.clearMessages();
    this.savingProfile.set(true);

    this.profileService.updateProfile(req).subscribe({
      next: (res) => {
        this.savingProfile.set(false);
        if (res.succeeded) {
          this.profile.set(res.data);
          // Also update AuthService local cache
          const current = this.authService.currentUser();
          if (current) {
            this.authService.currentUser.set({
              ...current,
              fullName: req.fullName ?? current.fullName,
            });
            localStorage.setItem('auth_user', JSON.stringify(this.authService.currentUser()));
          }
          this.showSuccess('Profile updated successfully!');
        } else {
          this.showError(res.errors?.[0] ?? 'Failed to update profile.');
        }
      },
      error: () => {
        this.savingProfile.set(false);
        this.showError('Failed to update profile.');
      },
    });
  }

  onPasswordChange(req: ChangePasswordRequest): void {
    this.clearMessages();
    this.savingPassword.set(true);

    this.profileService.changePassword(req).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        if (res.succeeded) {
          this.showSuccess('Password changed successfully!');
        } else {
          this.showError(res.errors?.[0] ?? 'Failed to change password.');
        }
      },
      error: (err) => {
        this.savingPassword.set(false);
        const msg = err?.error?.errors?.[0] ?? 'Failed to change password.';
        this.showError(msg);
      },
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
