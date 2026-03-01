import { Component, OnInit, inject, signal, output } from '@angular/core';
import { Router } from '@angular/router';
import { WatchedAreaService } from '../../../../shared/services/watched-area.service';
import { WatchedAreaResponse } from '../../../../models/watched-area.model';

@Component({
    selector: 'app-watched-areas-list',
    templateUrl: './watched-areas-list.html',
    styleUrl: './watched-areas-list.css',
})
export class WatchedAreasList implements OnInit {
    private readonly watchedAreaService = inject(WatchedAreaService);
    private readonly router = inject(Router);

    readonly areas = signal<WatchedAreaResponse[]>([]);
    readonly isLoading = signal(false);

    ngOnInit(): void {
        this.loadAreas();
    }

    loadAreas(): void {
        this.isLoading.set(true);
        this.watchedAreaService.getWatchedAreas().subscribe({
            next: (res) => {
                if (res.succeeded) {
                    this.areas.set(res.data ?? []);
                }
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    viewOnMap(area: WatchedAreaResponse): void {
        this.router.navigate(['/maps'], {
            queryParams: { lat: area.latitude, lng: area.longitude },
        });
    }

    deleteArea(id: number): void {
        this.watchedAreaService.deleteWatchedArea(id).subscribe({
            next: () => this.loadAreas(),
        });
    }
}
