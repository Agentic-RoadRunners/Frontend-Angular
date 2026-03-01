import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/pagination.model';
import {
    WatchedAreaResponse,
    CreateWatchedAreaRequest,
    UpdateWatchedAreaRequest,
} from '../../models/watched-area.model';

@Injectable({ providedIn: 'root' })
export class WatchedAreaService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getWatchedAreas(): Observable<ApiResponse<WatchedAreaResponse[]>> {
        return this.http.get<ApiResponse<WatchedAreaResponse[]>>(
            `${this.apiUrl}/watched-areas`
        );
    }

    createWatchedArea(
        request: CreateWatchedAreaRequest
    ): Observable<ApiResponse<WatchedAreaResponse>> {
        return this.http.post<ApiResponse<WatchedAreaResponse>>(
            `${this.apiUrl}/watched-areas`,
            request
        );
    }

    updateWatchedArea(
        id: number,
        request: UpdateWatchedAreaRequest
    ): Observable<ApiResponse<WatchedAreaResponse>> {
        return this.http.put<ApiResponse<WatchedAreaResponse>>(
            `${this.apiUrl}/watched-areas/${id}`,
            request
        );
    }

    deleteWatchedArea(id: number): Observable<ApiResponse<string>> {
        return this.http.delete<ApiResponse<string>>(
            `${this.apiUrl}/watched-areas/${id}`
        );
    }
}
