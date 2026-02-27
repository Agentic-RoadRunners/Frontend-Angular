/** Matches backend VerificationResponse */
export interface VerificationResponse {
  id: number;
  incidentId: string;
  userId: string;
  userName?: string;
  isPositive: boolean;
  createdAt: string;
}

/** Matches backend VerificationSummaryResponse */
export interface VerificationSummaryResponse {
  incidentId: string;
  positiveCount: number;
  negativeCount: number;
  verifications: VerificationResponse[];
}
