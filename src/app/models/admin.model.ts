export interface AdminUserResponse {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    trustScore: number;
    status: string;
    roles: string[];
    totalIncidents: number;
    totalComments: number;
    createdAt: string;
}

export interface UpdateUserByAdminRequest {
    fullName?: string;
    roles?: string[];
}

export interface AdminIncidentUpdateRequest {
    title?: string;
    description?: string;
    categoryId?: number;
    status?: string;
}
