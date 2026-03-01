import { Component, OnInit, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MapView, MapMarker, HeatPoint, MapClickEvent } from '../components/map-view/map-view';
import { IncidentForm, IncidentFormData } from '../components/incident-form/incident-form';
import { InspectIncidentModal } from '../components/inspect-incident-modal/inspect-incident-modal';
import { RoutePlanner, RouteReadyEvent, JourneyEndedEvent } from '../components/route-planner/route-planner';
import { RouteVerificationModal } from '../components/route-verification-modal/route-verification-modal';
import { WatchedAreasPanel } from '../components/watched-areas-panel/watched-areas-panel';
import { IncidentsService } from '../../../shared/services/incidents.service';
import { IncidentResponse } from '../../../models/incident.model';
import { WatchedAreaResponse } from '../../../models/watched-area.model';
import { RouteIncidentDto } from '../../../models/journey.model';

const ANTALYA_LAT = 36.8969;
const ANTALYA_LNG = 30.7133;

@Component({
  selector: 'app-maps-page',
  imports: [FormsModule, MapView, IncidentForm, InspectIncidentModal, RoutePlanner, RouteVerificationModal, WatchedAreasPanel],
  templateUrl: './maps-page.html',
  styleUrl: './maps-page.css',
})
export class MapsPage implements OnInit {
  private mapView = viewChild.required(MapView);

  readonly centerLat = ANTALYA_LAT;
  readonly centerLng = ANTALYA_LNG;
  heatPoints: HeatPoint[] = [];

  incidents: IncidentResponse[] = [];
  markers: MapMarker[] = [];

  selectedCommentIncident: IncidentResponse | null = null;
  inspectingIncident: IncidentResponse | null = null;

  isSelectingLocation = false;
  showIncidentForm = false;
  pendingLat = 0;
  pendingLng = 0;

  // ── Route planner state ───────────────────────────
  showRoutePlanner = false;
  routePickMode: 'none' | 'start' | 'end' = 'none';
  routeStart: { lat: number; lng: number } | null = null;
  routeEnd: { lat: number; lng: number } | null = null;

  // ── Verification modal state ──────────────────────
  showVerificationModal = false;
  verificationIncidents: RouteIncidentDto[] = [];

  // ── Watched areas state ───────────────────────────
  showWatchedAreas = false;
  watchedAreas: WatchedAreaResponse[] = [];
  isPickingWatchedArea = false;
  private watchedAreasPanel = viewChild<WatchedAreasPanel>('watchedAreasPanel');

  // ── Query params (fly-to) ─────────────────────────
  private targetLat: number | null = null;
  private targetLng: number | null = null;
  private targetIncidentId: string | null = null;

  constructor(
    private incidentService: IncidentsService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['lat'] && params['lng']) {
        this.targetLat = +params['lat'];
        this.targetLng = +params['lng'];
        this.targetIncidentId = params['incidentId'] || null;
      }
    });

    this.loadIncidents();
  }

  loadIncidents(): void {
    this.incidentService.getIncidents().subscribe({
      next: (items) => {
        this.incidents = Array.isArray(items) ? items : [];
        this.markers = this.incidents.map((inc) => ({
          lat: inc.latitude,
          lng: inc.longitude,
          popupText: inc.title ?? inc.categoryName,
        }));

        // Build heat points from incidents so the heatmap layer has data
        this.heatPoints = this.incidents.map((inc) => ({
          lat: inc.latitude,
          lng: inc.longitude,
          intensity: 0.6,
        }));

        console.log('✅ Incidents loaded:', this.incidents.length);
        this.flyToTargetIfNeeded();
      },
      error: (err) => console.error('❌ Failed to load incidents:', err),
    });
  }

  private flyToTargetIfNeeded(): void {
    if (this.targetLat !== null && this.targetLng !== null) {
      setTimeout(() => {
        if (this.targetIncidentId) {
          this.mapView().openIncidentById(this.targetIncidentId);
        } else {
          this.mapView().flyTo(this.targetLat!, this.targetLng!, 17);
        }
        this.targetLat = null;
        this.targetLng = null;
        this.targetIncidentId = null;
      }, 500);
    }
  }

  get heatmapVisible(): boolean {
    return this.mapView().isHeatmapVisible;
  }

  toggleHeatmap(): void {
    this.mapView().toggleHeatmap();
  }

  toggleSelectionMode(): void {
    if (this.isSelectingLocation) {
      this.isSelectingLocation = false;
    } else {
      this.showIncidentForm = false;
      this.routePickMode = 'none';
      this.isSelectingLocation = true;
    }
  }

  /** "Plan Route" toolbar button */
  onPlanRouteClick(): void {
    if (this.showRoutePlanner || this.routePickMode !== 'none') {
      // Cancel everything
      this.routePickMode = 'none';
      this.showRoutePlanner = false;
      this.routeStart = null;
      this.routeEnd = null;
      this.mapView().clearRoute();
    } else {
      // Step 1: pick start point
      this.isSelectingLocation = false;
      this.showIncidentForm = false;
      this.routePickMode = 'start';
    }
  }

  get routeButtonLabel(): string {
    if (this.routePickMode !== 'none' || this.showRoutePlanner) return '✕ Cancel Route';
    return '🗺️ Plan Route';
  }

  get routeButtonActive(): boolean {
    return this.routePickMode !== 'none' || this.showRoutePlanner;
  }

  onMapClick(event: MapClickEvent): void {
    // If we're picking a watched area center, forward to the panel
    if (this.isPickingWatchedArea) {
      this.watchedAreasPanel()?.submitArea(event.lat, event.lng);
      this.isPickingWatchedArea = false;
      return;
    }
    this.pendingLat = event.lat;
    this.pendingLng = event.lng;
    this.isSelectingLocation = false;
    this.showIncidentForm = true;
  }

  onWatchedAreaPickRequested(): void {
    this.isPickingWatchedArea = true;
    this.isSelectingLocation = true;
    this.showIncidentForm = false;
  }

  onWatchedAreaPickCancelled(): void {
    this.isPickingWatchedArea = false;
    this.isSelectingLocation = false;
  }

  /** Map click for route point picking — auto-advances through start → end → open panel */
  onRoutePointPick(event: { mode: 'start' | 'end'; lat: number; lng: number }): void {
    if (event.mode === 'start') {
      this.routeStart = { lat: event.lat, lng: event.lng };
      this.routePickMode = 'end';           // Step 2: pick end
    } else {
      this.routeEnd = { lat: event.lat, lng: event.lng };
      this.routePickMode = 'none';
      this.showRoutePlanner = true;         // Step 3: open panel
    }
  }

  onRouteReady(event: RouteReadyEvent): void {
    this.mapView().drawRoute(event.osrmCoords);
    this.mapView().setRouteEndpoints(
      [event.osrmCoords[0][0], event.osrmCoords[0][1]],
      [event.osrmCoords[event.osrmCoords.length - 1][0], event.osrmCoords[event.osrmCoords.length - 1][1]],
    );
    this.mapView().markRouteIncidents(event.incidents);
  }

  /** Route planner close button */
  onRouteCleared(): void {
    this.mapView().clearRoute();
    this.routeStart = null;
    this.routeEnd = null;
    this.showRoutePlanner = false;
  }

  onJourneyEnded(event: JourneyEndedEvent): void {
    this.mapView().clearRoute();
    if (event.incidents.length > 0) {
      this.verificationIncidents = event.incidents;
      this.showVerificationModal = true;
    }
  }

  onVerificationCompleted(): void {
    this.showVerificationModal = false;
    this.verificationIncidents = [];
  }

  onIncidentSubmit(data: IncidentFormData): void {
    const localId = this.mapView().addIncidentMarker(data);
    this.showIncidentForm = false;
    this.isSelectingLocation = false;

    this.incidentService.createIncident(data).subscribe({
      next: (response) => {
        if (response.succeeded) {
          console.log('✅ Incident created:', response.data);
          this.loadIncidents();
        } else {
          console.error('❌ Incident creation failed:', response.message);
          this.mapView().removeIncidentMarker(localId);
        }
      },
      error: (err) => {
        console.error('❌ HTTP error:', err);
        this.mapView().removeIncidentMarker(localId);
      },
    });
  }

  onIncidentCancel(): void {
    this.showIncidentForm = false;
  }

  refreshSingleIncident(incidentId: string): void {
    this.incidentService.getIncidentById(incidentId).subscribe({
      next: (updated) => {
        const idx = this.incidents.findIndex((i) => i.id === updated.id);
        if (idx !== -1) {
          this.incidents = [
            ...this.incidents.slice(0, idx),
            updated,
            ...this.incidents.slice(idx + 1),
          ];
        }
        if (this.inspectingIncident?.id === updated.id) {
          this.inspectingIncident = updated;
        }
      },
      error: (err) => console.error('❌ Failed to refresh incident:', err),
    });
  }
}
