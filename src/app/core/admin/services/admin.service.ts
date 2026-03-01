import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../models/pagination.model';
import {
    AdminUserResponse,
    UpdateUserByAdminRequest,
    AdminIncidentUpdateRequest,
} from '../../../models/admin.model';
import { IncidentResponse } from '../../../models/incident.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getUsers(
        page = 1,
        pageSize = 20,
        search?: string,
        role?: string,
        status?: string
    ): Observable<ApiResponse<AdminUserResponse[]>> {
        let params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);
        if (search) params = params.set('search', search);
        if (role) params = params.set('role', role);
        if (status) params = params.set('status', status);
        return this.http.get<ApiResponse<AdminUserResponse[]>>(
            `${this.apiUrl}/admin/users`,
            { params }
        );
    }

    banUser(userId: string): Observable<ApiResponse<string>> {
        return this.http.patch<ApiResponse<string>>(
            `${this.apiUrl}/admin/users/${userId}/ban`,
            {}
        );
    }

    unbanUser(userId: string): Observable<ApiResponse<string>> {
        return this.http.patch<ApiResponse<string>>(
            `${this.apiUrl}/admin/users/${userId}/unban`,
            {}
        );
    }

    updateUser(
        userId: string,
        request: UpdateUserByAdminRequest
    ): Observable<ApiResponse<AdminUserResponse>> {
        return this.http.put<ApiResponse<AdminUserResponse>>(
            `${this.apiUrl}/admin/users/${userId}`,
            request
        );
    }

    getIncidents(
        page = 1,
        pageSize = 20
    ): Observable<ApiResponse<IncidentResponse[]>> {
        const params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);
        return this.http.get<ApiResponse<IncidentResponse[]>>(
            `${this.apiUrl}/admin/incidents`,
            { params }
        );
    }

    updateIncident(
        incidentId: string,
        request: AdminIncidentUpdateRequest
    ): Observable<ApiResponse<IncidentResponse>> {
        return this.http.put<ApiResponse<IncidentResponse>>(
            `${this.apiUrl}/admin/incidents/${incidentId}`,
            request
        );
    }

    deleteIncident(incidentId: string): Observable<ApiResponse<string>> {
        return this.http.delete<ApiResponse<string>>(
            `${this.apiUrl}/admin/incidents/${incidentId}`
        );
    }
}
