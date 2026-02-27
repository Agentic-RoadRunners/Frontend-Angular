import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/pagination.model';
import { CommentResponse, CreateCommentRequest } from '../../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getComments(incidentId: string, page = 1, pageSize = 50): Observable<CommentResponse[]> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http
      .get<ApiResponse<any>>(`${this.apiUrl}/incidents/${incidentId}/comments`, { params })
      .pipe(
        map((res) => {
          const data = res.data;
          if (Array.isArray(data)) return data;
          if (data?.items) return data.items;
          if (data?.results) return data.results;
          return [];
        }),
      );
  }

  createComment(incidentId: string, content: string): Observable<ApiResponse<CommentResponse>> {
    const body: CreateCommentRequest = { content };
    return this.http.post<ApiResponse<CommentResponse>>(
      `${this.apiUrl}/incidents/${incidentId}/comments`,
      body,
    );
  }

  deleteComment(incidentId: string, commentId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `${this.apiUrl}/incidents/${incidentId}/comments/${commentId}`,
    );
  }
}
