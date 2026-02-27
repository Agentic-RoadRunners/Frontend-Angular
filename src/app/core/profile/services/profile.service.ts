import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../models/pagination.model';
import {
  UserProfileResponse,
  UserStatsResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../../../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = `${environment.apiUrl}/users`;
  private readonly http = inject(HttpClient);

  /** GET /api/users/me */
  getMyProfile(): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.get<ApiResponse<UserProfileResponse>>(`${this.api}/me`);
  }

  /** PUT /api/users/me */
  updateProfile(req: UpdateProfileRequest): Observable<ApiResponse<UserProfileResponse>> {
    return this.http.put<ApiResponse<UserProfileResponse>>(`${this.api}/me`, req);
  }

  /** PUT /api/users/me/password */
  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.api}/me/password`, req);
  }

  /** GET /api/users/me/stats */
  getMyStats(): Observable<ApiResponse<UserStatsResponse>> {
    return this.http.get<ApiResponse<UserStatsResponse>>(`${this.api}/me/stats`);
  }
}
