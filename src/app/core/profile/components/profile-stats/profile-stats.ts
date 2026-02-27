import { Component, Input } from '@angular/core';
import { UserStatsResponse } from '../../../../models/user.model';

@Component({
  selector: 'app-profile-stats',
  templateUrl: './profile-stats.html',
  styleUrl: './profile-stats.css',
})
export class ProfileStats {
  @Input({ required: true }) stats!: UserStatsResponse;
}
