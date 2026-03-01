import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MunicipalityService } from '../services/municipality.service';
import { AuthService } from '../../../auth/auth.service';
import { IncidentResponse, IncidentStatus } from '../../../models/incident.model';

@Component({
    selector: 'app-municipality-page',
    imports: [DatePipe],
    templateUrl: './municipality-page.html',
    styleUrl: './municipality-page.css',
})
export class MunicipalityPage implements OnInit {
    private readonly municipalityService = inject(MunicipalityService);
    private readonly authService = inject(AuthService);

    readonly incidents = signal<IncidentResponse[]>([]);
    readonly isLoading = signal(false);
    readonly hasError = signal(false);
    readonly statusFilter = signal<string>('');
    readonly toastMessage = signal('');
    readonly toastType = signal<'success' | 'error'>('success');
    readonly page = signal(1);
    readonly totalPages = signal(1);

    readonly statuses: IncidentStatus[] = ['Pending', 'Verified', 'Disputed', 'Resolved'];

    get municipalityId(): number {
        // Falls back to 1 — in a real app this would come from user profile
        return (this.authService.currentUser() as any)?.municipalityId ?? 1;
    }

    ngOnInit(): void {
        this.loadIncidents();
    }

    loadIncidents(): void {
        this.isLoading.set(true);
        this.hasError.set(false);

        this.municipalityService.getIncidentsByMunicipality(this.municipalityId, this.page(), 20).subscribe({
            next: (res) => {
                if (res.succeeded && res.data) {
                    const items: IncidentResponse[] = (res.data as any).items ?? (res.data as any);
                    this.incidents.set(
                        this.statusFilter()
                            ? items.filter((i) => i.status === this.statusFilter())
                            : items,
                    );
                    this.totalPages.set((res.data as any).totalPages ?? 1);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.hasError.set(true);
                this.isLoading.set(false);
            },
        });
    }

    onFilterStatus(status: string): void {
        this.statusFilter.set(status);
        this.page.set(1);
        this.loadIncidents();
    }

    changeStatus(incident: IncidentResponse, newStatus: string): void {
        this.municipalityService.updateIncidentStatus(incident.id, newStatus).subscribe({
            next: () => {
                this.showToast(`Status updated to ${newStatus}`, 'success');
                this.loadIncidents();
            },
            error: () => this.showToast('Failed to update status', 'error'),
        });
    }

    prevPage(): void {
        if (this.page() > 1) {
            this.page.update((p) => p - 1);
            this.loadIncidents();
        }
    }

    nextPage(): void {
        if (this.page() < this.totalPages()) {
            this.page.update((p) => p + 1);
            this.loadIncidents();
        }
    }

    private showToast(msg: string, type: 'success' | 'error'): void {
        this.toastMessage.set(msg);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 4000);
    }
}
