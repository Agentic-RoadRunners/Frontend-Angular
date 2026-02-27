import { Component, Input } from '@angular/core';
import { UserProfileResponse } from '../../../../models/user.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile-header',
  imports: [DatePipe],
  templateUrl: './profile-header.html',
  styleUrl: './profile-header.css',
})
export class ProfileHeader {
  @Input({ required: true }) profile!: UserProfileResponse;

  get initials(): string {
    if (!this.profile.fullName) return '?';
    return this.profile.fullName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get trustColor(): string {
    const s = this.profile.trustScore;
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
