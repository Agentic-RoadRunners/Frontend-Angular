import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    GraphResponse,
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
} from '../../../models/knowledge-graph.model';

@Injectable({ providedIn: 'root' })
export class KnowledgeGraphService {
    private readonly baseUrl = environment.aiServiceUrl;

    constructor(private readonly http: HttpClient) { }

    /** Build auth headers manually — authInterceptor only targets environment.apiUrl */
    private authHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getGraph(): Observable<GraphResponse> {
        return this.http.get<GraphResponse>(`${this.baseUrl}/kg/graph`, {
            headers: this.authHeaders(),
        });
    }

    explainNode(nodeId: string, nodeType: string): Observable<ExplainResponse> {
        const body: ExplainRequest = { node_id: nodeId, node_type: nodeType };
        return this.http.post<ExplainResponse>(`${this.baseUrl}/kg/explain`, body, {
            headers: this.authHeaders(),
        });
    }

    chat(message: string, history: { role: string; content: string }[]): Observable<ChatResponse> {
        const body: ChatRequest = {
            message,
            conversation_history: history as ChatRequest['conversation_history'],
        };
        return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, body, {
            headers: this.authHeaders(),
        });
    }
}
