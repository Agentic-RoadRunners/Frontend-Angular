/** Matches backend WatchedAreaResponse */
export interface WatchedAreaResponse {
  id: number;
  label?: string;
  latitude: number;
  longitude: number;
  radiusInMeters?: number;
}

/** Matches backend CreateWatchedAreaRequest */
export interface CreateWatchedAreaRequest {
  label?: string;
  latitude: number;
  longitude: number;
  radiusInMeters: number;
}

/** Matches backend UpdateWatchedAreaRequest */
export interface UpdateWatchedAreaRequest {
  label?: string;
  latitude?: number;
  longitude?: number;
  radiusInMeters?: number;
}
