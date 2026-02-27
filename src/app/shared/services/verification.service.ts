import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/pagination.model';
import { VerificationSummaryResponse } from '../../models/verification.model';

@Injectable({ providedIn: 'root' })
export class VerificationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  verify(incidentId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/incidents/${incidentId}/verify`, {});
  }

  dispute(incidentId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/incidents/${incidentId}/dispute`, {});
  }

  removeVote(incidentId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/incidents/${incidentId}/verify`);
  }

  getVerifications(incidentId: string): Observable<ApiResponse<VerificationSummaryResponse>> {
    return this.http.get<ApiResponse<VerificationSummaryResponse>>(
      `${this.apiUrl}/incidents/${incidentId}/verifications`,
    );
  }
}
