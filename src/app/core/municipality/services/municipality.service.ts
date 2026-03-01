import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../models/pagination.model';
import { IncidentResponse } from '../../../models/incident.model';

@Injectable({ providedIn: 'root' })
export class MunicipalityService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getIncidentsByMunicipality(
        municipalityId: number,
        page = 1,
        pageSize = 50
    ): Observable<ApiResponse<IncidentResponse[]>> {
        const params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);
        return this.http.get<ApiResponse<IncidentResponse[]>>(
            `${this.apiUrl}/incidents/by-municipality/${municipalityId}`,
            { params }
        );
    }

    updateIncidentStatus(
        incidentId: string,
        newStatus: string
    ): Observable<ApiResponse<string>> {
        return this.http.patch<ApiResponse<string>>(
            `${this.apiUrl}/incidents/${incidentId}/status`,
            { newStatus }
        );
    }
}
