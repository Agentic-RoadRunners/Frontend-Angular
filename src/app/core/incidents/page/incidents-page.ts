import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IncidentFilters,
  SortField,
  SortDirection,
  SortOption,
} from '../services/incident-filter.model';
import { IncidentsService } from '../../../shared/services/incidents.service';
import { IncidentResponse } from '../../../models/incident.model';
import { IncidentFilter, FilterOption } from '../components/incident-filter/incident-filter';
import { IncidentCard } from '../components/incident-card/incident-card';

const EMPTY_FILTERS: IncidentFilters = {
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  municipalityId: '',
  status: '',
};

const SORT_OPTIONS: SortOption[] = [
  { field: 'createdAt', direction: 'desc', label: 'Newest First' },
  { field: 'createdAt', direction: 'asc', label: 'Oldest First' },
  { field: 'title', direction: 'asc', label: 'Title A–Z' },
  { field: 'title', direction: 'desc', label: 'Title Z–A' },
  { field: 'categoryName', direction: 'asc', label: 'Category A–Z' },
  { field: 'status', direction: 'asc', label: 'Status A–Z' },
];

const PAGE_SIZE = 12;

@Component({
  selector: 'app-incidents-page',
  imports: [IncidentFilter, IncidentCard, FormsModule],
  templateUrl: './incidents-page.html',
  styleUrl: './incidents-page.css',
})
export class IncidentsPage implements OnInit {
  private readonly incidentService = inject(IncidentsService);
  constructor(private router: Router) {}

  readonly allIncidents = signal<IncidentResponse[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  /* ── Search ───────────────────────────── */
  readonly searchQuery = signal('');

  /* ── Sort ──────────────────────────────── */
  readonly sortOptions = SORT_OPTIONS;
  readonly activeSortIndex = signal(0);

  /* ── Pagination ────────────────────────── */
  readonly currentPage = signal(1);

  private readonly _filters = signal<IncidentFilters>({ ...EMPTY_FILTERS });

  /* ── Filtered + searched + sorted list ── */
  readonly processedIncidents = computed(() => {
    let list = this.applyFilters(this.allIncidents(), this._filters());
    list = this.applySearch(list, this.searchQuery());
    list = this.applySort(list, this.sortOptions[this.activeSortIndex()]);
    return list;
  });

  /* ── Paginated slice ────────────────────── */
  readonly paginatedIncidents = computed(() => {
    const all = this.processedIncidents();
    return all.slice(0, this.currentPage() * PAGE_SIZE);
  });

  readonly hasMore = computed(
    () => this.paginatedIncidents().length < this.processedIncidents().length,
  );

  readonly totalPages = computed(() => Math.ceil(this.processedIncidents().length / PAGE_SIZE));

  /* ── Summary stats ──────────────────────── */
  readonly statusCounts = computed(() => {
    const all = this.allIncidents();
    return {
      total: all.length,
      pending: all.filter((i) => i.status === 'Pending').length,
      verified: all.filter((i) => i.status === 'Verified').length,
      resolved: all.filter((i) => i.status === 'Resolved').length,
      rejected: all.filter((i) => i.status === 'Disputed').length,
    };
  });

  readonly categories = computed<FilterOption[]>(() => {
    const seen = new Set<number>();
    const result: FilterOption[] = [];
    for (const inc of this.allIncidents()) {
      if (!seen.has(inc.categoryId)) {
        seen.add(inc.categoryId);
        result.push({ id: inc.categoryId.toString(), name: inc.categoryName });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly municipalities = computed<FilterOption[]>(() => {
    const seen = new Set<string>();
    const result: FilterOption[] = [];
    for (const inc of this.allIncidents()) {
      if (inc.municipalityId && !seen.has(inc.municipalityId.toString())) {
        seen.add(inc.municipalityId.toString());
        result.push({ id: inc.municipalityId.toString(), name: inc.municipalityName! });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.incidentService.getIncidents().subscribe({
      next: (data) => {
        this.allIncidents.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query.trim());
    this.currentPage.set(1);
  }

  onSortChange(index: number): void {
    this.activeSortIndex.set(index);
    this.currentPage.set(1);
  }

  onFiltersChange(filters: IncidentFilters): void {
    this._filters.set(filters);
    this.currentPage.set(1);
  }

  loadMore(): void {
    this.currentPage.update((p) => p + 1);
  }

  /* ── Private helpers ────────────────────── */
  private applyFilters(
    incidents: IncidentResponse[],
    filters: IncidentFilters,
  ): IncidentResponse[] {
    return incidents.filter((inc) => {
      const dateStr = inc.createdAt.substring(0, 10);
      if (filters.dateFrom && dateStr < filters.dateFrom) return false;
      if (filters.dateTo && dateStr > filters.dateTo) return false;
      if (filters.categoryId && inc.categoryId.toString() !== filters.categoryId) return false;
      if (filters.municipalityId && inc.municipalityId?.toString() !== filters.municipalityId)
        return false;
      if (filters.status && inc.status !== filters.status) return false;
      return true;
    });
  }

  private applySearch(incidents: IncidentResponse[], query: string): IncidentResponse[] {
    if (!query) return incidents;
    const q = query.toLowerCase();
    return incidents.filter(
      (inc) =>
        (inc.title?.toLowerCase().includes(q) ?? false) ||
        (inc.description?.toLowerCase().includes(q) ?? false) ||
        (inc.categoryName?.toLowerCase().includes(q) ?? false) ||
        (inc.reporterName?.toLowerCase().includes(q) ?? false) ||
        (inc.municipalityName?.toLowerCase().includes(q) ?? false),
    );
  }

  private applySort(incidents: IncidentResponse[], sort: SortOption): IncidentResponse[] {
    const sorted = [...incidents];
    const dir = sort.direction === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      const aVal = (a[sort.field] ?? '').toString().toLowerCase();
      const bVal = (b[sort.field] ?? '').toString().toLowerCase();
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });
    return sorted;
  }

  goToIncidentOnMap(incident: IncidentResponse): void {
    this.router.navigate(['/maps'], {
      queryParams: {
        lat: incident.latitude,
        lng: incident.longitude,
        incidentId: incident.id,
      },
    });
  }
}
