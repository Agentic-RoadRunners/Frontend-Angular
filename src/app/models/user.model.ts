export type UserStatus = 'Active' | 'Banned';

/** Matches backend UserProfileResponse */
export interface UserProfileResponse {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  trustScore: number;
  status: UserStatus;
  roles: string[];
  createdAt: string;
}

/** Matches backend PublicProfileResponse */
export interface PublicProfileResponse {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  trustScore: number;
  createdAt: string;
}

/** Matches backend UserStatsResponse */
export interface UserStatsResponse {
  userId: string;
  totalIncidents: number;
  totalComments: number;
  totalVerifications: number;
  trustScore: number;
  memberSince: string;
}

/** Matches backend AuthResponse */
export interface AuthResponse {
  userId: string;
  email: string;
  fullName?: string;
  accessToken: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}
