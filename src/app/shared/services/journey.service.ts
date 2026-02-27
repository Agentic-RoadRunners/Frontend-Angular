import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/pagination.model';
import {
  StartJourneyRequest,
  StartJourneyResponse,
  EndJourneyResponse,
  UserJourneyResponse,
} from '../../models/journey.model';

@Injectable({ providedIn: 'root' })
export class JourneyService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  startJourney(req: StartJourneyRequest): Observable<StartJourneyResponse> {
    return this.http
      .post<ApiResponse<StartJourneyResponse>>(`${this.apiUrl}/journeys/start`, req)
      .pipe(map((r) => r.data));
  }

  endJourney(): Observable<EndJourneyResponse> {
    return this.http
      .post<ApiResponse<EndJourneyResponse>>(`${this.apiUrl}/journeys/end`, {})
      .pipe(map((r) => r.data));
  }

  getActiveJourney(): Observable<UserJourneyResponse | null> {
    return this.http
      .get<ApiResponse<UserJourneyResponse>>(`${this.apiUrl}/journeys/active`)
      .pipe(map((r) => r.data ?? null));
  }

  /** OSRM public router — returns [lat, lng] pairs (Leaflet order) */
  fetchOsrmRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): Observable<Array<[number, number]>> {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLng},${startLat};${endLng},${endLat}` +
      `?overview=full&geometries=geojson`;

    return this.http.get<any>(url).pipe(
      map((res) =>
        // GeoJSON coords are [lng, lat] → swap to [lat, lng] for Leaflet
        res.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
        ),
      ),
    );
  }
}
