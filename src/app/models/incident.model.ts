/** Matches backend IncidentStatus enum */
export type IncidentStatus = 'Pending' | 'Verified' | 'Disputed' | 'Resolved';

/** Matches backend IncidentResponse */
export interface IncidentResponse {
  id: string;
  reporterUserId: string;
  reporterName?: string;
  categoryId: number;
  categoryName: string;
  municipalityId?: number;
  municipalityName?: string;
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  positiveVerifications: number;
  negativeVerifications: number;
  commentCount: number;
  photoUrls: string[];
  createdAt: string;
  severity?: string;   // Neo4j AI analizi tamamlanınca dolar (low|medium|high|critical)
}

/** Embedded comment inside IncidentDetailResponse */
export interface CommentDto {
  id: number;
  userId: string;
  userName?: string;
  content: string;
  createdAt: string;
}

/** Embedded verification inside IncidentDetailResponse */
export interface VerificationDto {
  id: number;
  userId: string;
  userName?: string;
  isPositive: boolean;
  createdAt: string;
}

/** Matches backend IncidentDetailResponse */
export interface IncidentDetailResponse extends IncidentResponse {
  comments: CommentDto[];
  verifications: VerificationDto[];
}

/** Matches backend CreateIncidentRequest */
export interface CreateIncidentRequest {
  categoryId: number;
  municipalityId?: number;
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
}

/** Matches backend NearbyIncidentsRequest (sent as query params) */
export interface NearbyIncidentsRequest {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  page?: number;
  pageSize?: number;
}

export interface IncidentCategory {
  id: number;
  name: string;
}
