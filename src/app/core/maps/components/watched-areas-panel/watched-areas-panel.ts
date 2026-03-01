import { Component, OnInit, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WatchedAreaService } from '../../../../shared/services/watched-area.service';
import { WatchedAreaResponse, CreateWatchedAreaRequest } from '../../../../models/watched-area.model';

@Component({
    selector: 'app-watched-areas-panel',
    imports: [FormsModule],
    templateUrl: './watched-areas-panel.html',
    styleUrl: './watched-areas-panel.css',
})
export class WatchedAreasPanel implements OnInit {
    private readonly watchedAreaService = inject(WatchedAreaService);

    readonly areas = signal<WatchedAreaResponse[]>([]);
    readonly isLoading = signal(false);
    readonly showForm = signal(false);

    readonly areasChanged = output<WatchedAreaResponse[]>();
    readonly pickRequested = output<void>();
    readonly pickCancelled = output<void>();

    // Form state
    formLabel = '';
    formRadius = 500;

    ngOnInit(): void {
        this.loadAreas();
    }

    loadAreas(): void {
        this.isLoading.set(true);
        this.watchedAreaService.getWatchedAreas().subscribe({
            next: (res) => {
                if (res.succeeded) {
                    this.areas.set(res.data ?? []);
                    this.areasChanged.emit(this.areas());
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    openForm(): void {
        this.formLabel = '';
        this.formRadius = 500;
        this.showForm.set(true);
        this.pickRequested.emit();
    }

    cancelForm(): void {
        this.showForm.set(false);
        this.pickCancelled.emit();
    }

    submitArea(lat: number, lng: number): void {
        const req: CreateWatchedAreaRequest = {
            label: this.formLabel || undefined,
            latitude: lat,
            longitude: lng,
            radiusInMeters: this.formRadius,
        };
        this.watchedAreaService.createWatchedArea(req).subscribe({
            next: () => {
                this.showForm.set(false);
                this.loadAreas();
            },
        });
    }

    deleteArea(id: number): void {
        this.watchedAreaService.deleteWatchedArea(id).subscribe({
            next: () => this.loadAreas(),
        });
    }
}
