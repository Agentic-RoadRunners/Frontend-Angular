/** Matches backend StartJourneyRequest */
export interface StartJourneyRequest {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
}

/** Matches backend RouteIncidentDto */
export interface RouteIncidentDto {
  id: string;
  title?: string;
  categoryName: string;
  latitude: number;
  longitude: number;
  distanceFromRouteMeters: number;
  status: string;
}

/** Matches backend StartJourneyResponse */
export interface StartJourneyResponse {
  journeyId: string;
  distanceInKm: number;
  estimatedMinutes: number;
  incidentsOnRoute: number;
  incidents: RouteIncidentDto[];
  message: string;
}

/** Matches backend EndJourneyResponse */
export interface EndJourneyResponse {
  journeyId: string;
  distanceInKm: number;
  durationMinutes: number;
  message: string;
  askForIncidentReport: boolean;
  incidentPrompt?: string;
}

/** Matches backend UserJourneyResponse */
export interface UserJourneyResponse {
  id: string;
  userId: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  status: 'Active' | 'Completed';
  startedAt: string;
  endedAt?: string;
}
