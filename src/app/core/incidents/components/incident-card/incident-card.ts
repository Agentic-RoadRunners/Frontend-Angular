import { Component, input } from '@angular/core';
import { IncidentResponse } from '../../../../models/incident.model';
import { getCategoryStyle } from '../../../../shared/constants';

const STATUS_CLASSES: Record<string, string> = {
  Pending:     'status-pending',
  Verified:    'status-verified',
  Resolved:    'status-resolved',
  Disputed:    'status-disputed',
};

@Component({
  selector: 'app-incident-card',
  templateUrl: './incident-card.html',
  styleUrl: './incident-card.css',
})
export class IncidentCard {
  readonly incident = input.required<IncidentResponse>();

  getCategoryIcon(categoryId: number): string {
    return 'fas ' + getCategoryStyle(categoryId).icon;
  }

  getCategoryColor(categoryId: number): string {
    return getCategoryStyle(categoryId).color;
  }

  getCategoryLabel(categoryId: number): string {
    return getCategoryStyle(categoryId).label;
  }

  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'status-pending';
  }

  getStatusLabel(status: string): string {
    return status === 'UnderReview' ? 'Under Review' : status;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  timeAgo(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);

    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return this.formatDate(iso);
  }
}
