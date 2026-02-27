export interface OverviewStats {
  totalIncidents: number;
  pendingIncidents: number;
  verifiedIncidents: number;
  resolvedIncidents: number;
  totalUsers: number;
  avgResolutionTimeHours: number;
  incidentsLast7Days: number;
  incidentsLast30Days: number;
}

export interface CategoryData {
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TrendData {
  date: string;
  count: number;
  resolved: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface Hotspot {
  rank: number;
  latitude: number;
  longitude: number;
  address: string;
  incidentCount: number;
  dominantCategory: string;
}

export interface SeverityData {
  severity: string;
  count: number;
  percentage: number;
}

export interface WeatherCorrelation {
  condition: string;
  incidentCount: number;
  avgSeverity: number;
}

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  municipalityId?: string;
}