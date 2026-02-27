import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IncidentFilters } from '../../services/incident-filter.model';

export interface FilterOption {
  id: string;
  name: string;
}

const STATUSES: FilterOption[] = [
  { id: 'Pending',     name: 'Pending' },
  { id: 'Verified',   name: 'Verified' },
  { id: 'UnderReview', name: 'Under Review' },
  { id: 'Resolved',   name: 'Resolved' },
  { id: 'Rejected',   name: 'Rejected' },
];

@Component({
  selector: 'app-incident-filter',
  imports: [FormsModule],
  templateUrl: './incident-filter.html',
  styleUrl: './incident-filter.css',
})
export class IncidentFilter {
  readonly categories    = input<FilterOption[]>([]);
  readonly municipalities = input<FilterOption[]>([]);
  readonly filtersChange  = output<IncidentFilters>();

  readonly statuses = STATUSES;

  dateFrom       = '';
  dateTo         = '';
  categoryId     = '';
  municipalityId = '';
  selectedStatus = '';

  get hasActiveFilters(): boolean {
    return !!(
      this.dateFrom ||
      this.dateTo ||
      this.categoryId ||
      this.municipalityId ||
      this.selectedStatus
    );
  }

  onStatusClick(statusId: string): void {
    this.selectedStatus = this.selectedStatus === statusId ? '' : statusId;
    this.emit();
  }

  onChange(): void {
    this.emit();
  }

  clear(): void {
    this.dateFrom       = '';
    this.dateTo         = '';
    this.categoryId     = '';
    this.municipalityId = '';
    this.selectedStatus = '';
    this.emit();
  }

  private emit(): void {
    this.filtersChange.emit({
      dateFrom:       this.dateFrom,
      dateTo:         this.dateTo,
      categoryId:     this.categoryId,
      municipalityId: this.municipalityId,
      status:         this.selectedStatus,
    });
  }
}
