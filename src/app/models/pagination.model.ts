export interface ApiResponse<T> {
  succeeded: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface IncidentFilterParams extends PaginationParams {
  categoryId?: number;
  status?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}
