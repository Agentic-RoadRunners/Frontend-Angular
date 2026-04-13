// ── Knowledge Graph Models ───────────────────────────────────

export interface GraphNode {
    id: string;
    label: string;
    type: 'Incident' | 'Category' | 'Municipality' | 'LocationCluster';
    weight: number;
    properties: Record<string, unknown>;
}

export interface GraphEdge {
    source: string;
    target: string;
    relationship: string;
}

export interface GraphMetadata {
    total_nodes: number;
    total_edges: number;
    last_sync: string;
    node_counts: Record<string, number>;
}

export interface GraphResponse {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata: GraphMetadata;
}

export interface MunicipalityRisk {
    id: string;
    name: string;
    weight: number;
    incident_count: number;
    top_categories: string[];
    risk_level: string;
}

export interface RiskAreasResponse {
    municipalities: MunicipalityRisk[];
}

// ── Chat Models ─────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    message: string;
    conversation_history: ChatMessage[];
    thread_id: string;
}

export interface ChatResponse {
    answer: string;
    highlight_ids: string[];
    related_node_ids: string[];
    tool_calls_made: string[];
}

// ── Explain Models ──────────────────────────────────────────

export interface ExplainRequest {
    node_id: string;
    node_type: string;
}

export interface ExplainResponse {
    explanation: string;
    related_nodes: string[];
    highlight_ids: string[];
}
