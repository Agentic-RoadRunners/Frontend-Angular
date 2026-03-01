import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../models/pagination.model';
import { OverviewStats, CategoryData, TrendData } from '../../../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getOverviewStats(): Observable<ApiResponse<OverviewStats>> {
        return this.http.get<ApiResponse<OverviewStats>>(
            `${this.apiUrl}/analytics/overview`
        );
    }

    getCategoryStats(): Observable<CategoryData[]> {
        return this.http
            .get<ApiResponse<CategoryData[]>>(`${this.apiUrl}/analytics/categories`)
            .pipe(map((res) => res.data ?? []));
    }

    getTrendData(days = 30): Observable<TrendData[]> {
        const params = new HttpParams().set('days', days);
        return this.http
            .get<ApiResponse<TrendData[]>>(`${this.apiUrl}/analytics/trends`, { params })
            .pipe(map((res) => res.data ?? []));
    }
}
