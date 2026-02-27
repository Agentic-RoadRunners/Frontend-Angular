import {
  IncidentCategory,
  CreateIncidentRequest,
  IncidentResponse,
} from './../../models/incident.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class IncidentsService {
  private readonly apiUrl = environment.apiUrl;

  private categoriesSubject = new BehaviorSubject<IncidentCategory[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCategories(): Observable<IncidentCategory[]> {
    return this.http
      .get<ApiResponse<IncidentCategory[]>>(`${this.apiUrl}/incident-categories`)
      .pipe(
        map((response) => response.data ?? []),
        tap((categories) => this.categoriesSubject.next(categories)),
      );
  }

  createIncident(request: CreateIncidentRequest): Observable<ApiResponse<IncidentResponse>> {
    return this.http.post<ApiResponse<IncidentResponse>>(`${this.apiUrl}/incidents`, request);
  }

  getIncidents(page = 1, pageSize = 200): Observable<IncidentResponse[]> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/incidents`, { params }).pipe(
      tap((response) => console.log('📦 Raw incidents response:', response)),
      map((response) => {
        const data = response.data;
        // Backend direkt array dönüyorsa
        if (Array.isArray(data)) return data;
        // Sayfalı dönüyorsa — olası field isimleri
        if (data?.items) return data.items;
        if (data?.results) return data.results;
        if (data?.data) return data.data;
        return [];
      }),
    );
  }

  getIncidentById(id: string): Observable<IncidentResponse> {
    return this.http
      .get<ApiResponse<IncidentResponse>>(`${this.apiUrl}/incidents/${id}`)
      .pipe(map((response) => response.data!));
  }
}
