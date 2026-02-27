import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HomeOverviewStats {
  totalIncidents: number;
  totalUsers: number;
  resolvedCount: number;
  municipalityCount: number;
}

interface OverviewApiResponse {
  succeeded: boolean;
  message: string;
  data: HomeOverviewStats;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);

  /**
   * GET /api/analytics/overview
   * Returns platform-wide stats: total incidents, total users, resolved count, municipality count.
   * ⚠ Public endpoint — no auth required.
   */
  getOverviewStats(): Observable<HomeOverviewStats> {
    return this.http
      .get<OverviewApiResponse>(`${environment.apiUrl}/analytics/overview`)
      .pipe(map((res) => res.data));
  }
}
