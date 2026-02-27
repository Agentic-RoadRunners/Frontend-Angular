
export interface IncidentFilters {
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  municipalityId: string;
  status: string;
}

export type SortField = 'createdAt' | 'title' | 'categoryName' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}
