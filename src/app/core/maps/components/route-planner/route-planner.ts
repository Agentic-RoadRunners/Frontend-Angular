import { Component, input, output, signal, inject, OnDestroy } from '@angular/core';
import { switchMap, catchError, of, map, Subscription } from 'rxjs';
import { JourneyService } from '../../../../shared/services/journey.service';
import { getCategoryStyleByName } from '../../../../shared/constants';
import {
  StartJourneyResponse,
  EndJourneyResponse,
  RouteIncidentDto,
} from '../../../../models/journey.model';

export type PlannerState = 'idle' | 'loading' | 'active' | 'ended';

export interface RouteReadyEvent {
  osrmCoords: Array<[number, number]>;
  incidents: RouteIncidentDto[];
  info: StartJourneyResponse;
}

export interface JourneyEndedEvent {
  response: EndJourneyResponse;
  incidents: RouteIncidentDto[];
}

const ROUTE_DISTANCE_THRESHOLD_M = 10;

@Component({
  selector: 'app-route-planner',
  imports: [],
  templateUrl: './route-planner.html',
  styleUrl: './route-planner.css',
})
export class RoutePlanner implements OnDestroy {
  readonly startPoint = input<{ lat: number; lng: number } | null>(null);
  readonly endPoint = input<{ lat: number; lng: number } | null>(null);

  readonly routeReady = output<RouteReadyEvent>();
  readonly routeCleared = output<void>();
  readonly journeyEnded = output<JourneyEndedEvent>();

  private readonly journeyService = inject(JourneyService);
  private endSub?: Subscription;

  state = signal<PlannerState>('idle');
  minimized = signal(false);
  journeyInfo = signal<StartJourneyResponse | null>(null);
  errorMessage = signal<string | null>(null);
  routeIncidents = signal<RouteIncidentDto[]>([]);

  get canStart(): boolean {
    return this.startPoint() !== null && this.endPoint() !== null;
  }

  getStyle(categoryName: string) {
    return getCategoryStyleByName(categoryName);
  }

  toggleMinimize(): void {
    this.minimized.update((v) => !v);
  }

  close(): void {
    // End the backend journey silently if it's currently active
    if (this.state() === 'active') {
      this.endSub = this.journeyService.endJourney().subscribe({
        error: (err) => console.warn('Silent journey end failed:', err),
      });
    }
    this.state.set('idle');
    this.journeyInfo.set(null);
    this.errorMessage.set(null);
    this.routeIncidents.set([]);
    this.minimized.set(false);
    this.routeCleared.emit();
  }

  ngOnDestroy(): void {
    // Clean up: end any active journey when the component is destroyed
    if (this.state() === 'active') {
      this.journeyService.endJourney().subscribe({
        error: (err) => console.warn('Destroy journey end failed:', err),
      });
    }
    this.endSub?.unsubscribe();
  }

  startJourney(): void {
    const start = this.startPoint();
    const end = this.endPoint();
    if (!start || !end) return;

    this.state.set('loading');
    this.errorMessage.set(null);

    this.journeyService
      .startJourney({
        startLatitude: start.lat,
        startLongitude: start.lng,
        endLatitude: end.lat,
        endLongitude: end.lng,
      })
      .pipe(
        switchMap((journey) =>
          this.journeyService
            .fetchOsrmRoute(start.lat, start.lng, end.lat, end.lng)
            .pipe(
              catchError(() => {
                console.warn('OSRM unavailable, using straight line.');
                return of([[start.lat, start.lng], [end.lat, end.lng]] as Array<[number, number]>);
              }),
            )
            .pipe(map((coords) => ({ coords, journey }))),
        ),
      )
      .subscribe({
        next: ({ coords, journey }) => {
          const routeIncidents = journey.incidents.filter(
            (i) => i.distanceFromRouteMeters <= ROUTE_DISTANCE_THRESHOLD_M,
          );
          this.journeyInfo.set(journey);
          this.routeIncidents.set(routeIncidents);
          this.state.set('active');
          this.minimized.set(false);
          this.routeReady.emit({ osrmCoords: coords, incidents: routeIncidents, info: journey });
        },
        error: (err) => {
          console.error('Journey start failed:', err);
          const msg = err?.error?.message || 'Failed to start journey. Please try again.';
          this.errorMessage.set(msg);
          this.state.set('idle');
        },
      });
  }

  endJourney(): void {
    this.state.set('loading');
    this.journeyService.endJourney().subscribe({
      next: (response) => {
        const incidents = this.routeIncidents();
        this.journeyEnded.emit({ response, incidents });
        this.state.set('ended');
        setTimeout(() => {
          this.journeyInfo.set(null);
          this.routeIncidents.set([]);
          this.state.set('idle');
        }, 2500);
      },
      error: (err) => {
        console.error('Journey end failed:', err);
        const msg = err?.error?.message || 'Failed to end journey. Please try again.';
        this.errorMessage.set(msg);
        this.state.set('active');
      },
    });
  }
}
