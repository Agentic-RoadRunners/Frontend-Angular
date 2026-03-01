import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AdminUserResponse, AdminIncidentUpdateRequest } from '../../../models/admin.model';
import { IncidentResponse } from '../../../models/incident.model';

@Component({
    selector: 'app-admin-page',
    imports: [DatePipe],
    templateUrl: './admin-page.html',
    styleUrl: './admin-page.css',
})
export class AdminPage implements OnInit {
    private readonly adminService = inject(AdminService);

    readonly activeTab = signal<'users' | 'incidents'>('users');

    // ── Users state ──────────────────────────
    readonly users = signal<AdminUserResponse[]>([]);
    readonly usersLoading = signal(false);
    readonly userSearch = signal('');
    readonly userRoleFilter = signal('');
    readonly userPage = signal(1);
    readonly userTotalPages = signal(1);

    // ── Incidents state ──────────────────────
    readonly incidents = signal<IncidentResponse[]>([]);
    readonly incidentsLoading = signal(false);
    readonly incidentPage = signal(1);
    readonly incidentTotalPages = signal(1);

    // ── Modal state ──────────────────────────
    readonly editingUser = signal<AdminUserResponse | null>(null);
    readonly editingIncident = signal<IncidentResponse | null>(null);

    // ── Toast ────────────────────────────────
    readonly toastMessage = signal('');
    readonly toastType = signal<'success' | 'error'>('success');

    ngOnInit(): void {
        this.loadUsers();
    }

    switchTab(tab: 'users' | 'incidents'): void {
        this.activeTab.set(tab);
        if (tab === 'incidents' && this.incidents().length === 0) {
            this.loadIncidents();
        }
    }

    // ── Users ────────────────────────────────
    loadUsers(): void {
        this.usersLoading.set(true);
        this.adminService.getUsers(this.userPage(), 20, this.userSearch(), this.userRoleFilter()).subscribe({
            next: (res) => {
                if (res.succeeded && res.data) {
                    this.users.set(res.data);
                }
                this.usersLoading.set(false);
            },
            error: () => {
                this.usersLoading.set(false);
                this.showToast('Failed to load users', 'error');
            },
        });
    }

    onSearchUsers(term: string): void {
        this.userSearch.set(term);
        this.userPage.set(1);
        this.loadUsers();
    }

    onFilterRole(role: string): void {
        this.userRoleFilter.set(role);
        this.userPage.set(1);
        this.loadUsers();
    }

    prevUserPage(): void {
        if (this.userPage() > 1) {
            this.userPage.update((p) => p - 1);
            this.loadUsers();
        }
    }

    nextUserPage(): void {
        if (this.userPage() < this.userTotalPages()) {
            this.userPage.update((p) => p + 1);
            this.loadUsers();
        }
    }

    banUser(userId: string): void {
        this.adminService.banUser(userId).subscribe({
            next: () => {
                this.showToast('User banned successfully', 'success');
                this.loadUsers();
            },
            error: () => this.showToast('Failed to ban user', 'error'),
        });
    }

    unbanUser(userId: string): void {
        this.adminService.unbanUser(userId).subscribe({
            next: () => {
                this.showToast('User unbanned successfully', 'success');
                this.loadUsers();
            },
            error: () => this.showToast('Failed to unban user', 'error'),
        });
    }

    openEditUser(user: AdminUserResponse): void {
        this.editingUser.set({ ...user });
    }

    saveUser(user: AdminUserResponse, fullName: string): void {
        this.adminService.updateUser(user.id, { fullName }).subscribe({
            next: () => {
                this.editingUser.set(null);
                this.showToast('User updated', 'success');
                this.loadUsers();
            },
            error: () => this.showToast('Failed to update user', 'error'),
        });
    }

    // ── Incidents ────────────────────────────
    loadIncidents(): void {
        this.incidentsLoading.set(true);
        this.adminService.getIncidents(this.incidentPage(), 20).subscribe({
            next: (res) => {
                if (res.succeeded && res.data) {
                    this.incidents.set(res.data);
                }
                this.incidentsLoading.set(false);
            },
            error: () => {
                this.incidentsLoading.set(false);
                this.showToast('Failed to load incidents', 'error');
            },
        });
    }

    prevIncidentPage(): void {
        if (this.incidentPage() > 1) {
            this.incidentPage.update((p) => p - 1);
            this.loadIncidents();
        }
    }

    nextIncidentPage(): void {
        if (this.incidentPage() < this.incidentTotalPages()) {
            this.incidentPage.update((p) => p + 1);
            this.loadIncidents();
        }
    }

    openEditIncident(incident: IncidentResponse): void {
        this.editingIncident.set({ ...incident });
    }

    saveIncident(incident: IncidentResponse, update: AdminIncidentUpdateRequest): void {
        this.adminService.updateIncident(incident.id, update).subscribe({
            next: () => {
                this.editingIncident.set(null);
                this.showToast('Incident updated', 'success');
                this.loadIncidents();
            },
            error: () => this.showToast('Failed to update incident', 'error'),
        });
    }

    deleteIncident(incidentId: string): void {
        if (!confirm('Are you sure you want to delete this incident?')) return;
        this.adminService.deleteIncident(incidentId).subscribe({
            next: () => {
                this.showToast('Incident deleted', 'success');
                this.loadIncidents();
            },
            error: () => this.showToast('Failed to delete incident', 'error'),
        });
    }

    // ── Helpers ──────────────────────────────
    private showToast(msg: string, type: 'success' | 'error'): void {
        this.toastMessage.set(msg);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 4000);
    }
}
