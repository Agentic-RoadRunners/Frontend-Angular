import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  NgZone,
  viewChild,
  input,
  output,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.heat';
import { CreateIncidentRequest, IncidentResponse } from '../../../../models/incident.model';
import { RouteIncidentDto } from '../../../../models/journey.model';
import { getCategoryStyle, getCategoryStyleByName } from '../../../../shared/constants';

// Fix default marker icon paths broken by webpack/esbuild
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

export interface MapMarker {
  lat: number;
  lng: number;
  popupText?: string;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

export interface MapClickEvent {
  lat: number;
  lng: number;
}

/** Category id → icon/color/label mapping for map pins */

/** Local-only marker metadata (pending backend confirmation) */
// (PendingIncident interface removed — type is inlined in pendingMap)

@Component({
  selector: 'app-map-view',
  imports: [],
  templateUrl: './map-view.html',
  styleUrl: './map-view.css',
  host: {
    '[class.selection-mode]': 'selectionMode()',
    '[class.route-pick-mode]': 'routePickMode() !== "none"',
  },
})
export class MapView implements AfterViewInit, OnChanges, OnDestroy {
  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly centerLat = input(36.8969);
  readonly centerLng = input(30.7133);
  readonly zoom = input(14);
  readonly heatPoints = input<HeatPoint[]>([]);
  readonly selectionMode = input(false);
  // ✅ Backend'den gelen incident listesi
  readonly incidents = input<IncidentResponse[]>([]);

  readonly routePickMode = input<'none' | 'start' | 'end'>('none');

  readonly mapClick = output<MapClickEvent>();
  readonly mapReady = output<L.Map>();
  readonly inspectIncident = output<IncidentResponse>();
  readonly routePointPick = output<{ mode: 'start' | 'end'; lat: number; lng: number }>();

  private readonly ngZone = inject(NgZone);

  private map!: L.Map;
  private heatLayer: L.Layer | null = null;
  private incidentLayer = L.layerGroup();
  private routeIncidentLayer = L.layerGroup();

  private routePolyline: L.Polyline | null = null;
  private routePolylineBorder: L.Polyline | null = null;
  private routeStartMarker: L.CircleMarker | null = null;
  private routeEndMarker: L.CircleMarker | null = null;
  private incidentMarkerById = new Map<string, L.Marker>(); // ✅ ID ile marker erişimi

  private markerMap = new Map<string, L.Marker>();
  private pendingMap = new Map<
    string,
    { request: CreateIncidentRequest; localId: string; createdAt: Date }
  >();

  /* ── Lifecycle ────────────────────────────── */

  ngAfterViewInit(): void {
    this.initMap();
    this.registerMapClick();
    this.registerPopupActions();
    this.mapReady.emit(this.map);
    // İlk yüklemede incidents zaten gelmişse çiz
    if (this.incidents().length) {
      this.renderIncidents(this.incidents());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incidents'] && this.map) {
      // ✅ null/undefined guard
      const incoming = changes['incidents'].currentValue;
      this.renderIncidents(Array.isArray(incoming) ? incoming : []);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /* ── Public API ───────────────────────────── */

  get isHeatmapVisible(): boolean {
    return this.heatLayer !== null;
  }

  toggleHeatmap(): void {
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    } else {
      this.showHeatmap();
    }
  }

  /** Draw OSRM route polyline and fit bounds */
  drawRoute(latLngs: Array<[number, number]>): void {
    this.clearRoute();
    const points = latLngs.map(([lat, lng]) => L.latLng(lat, lng));
    const sharedOpts: L.PolylineOptions = {
      smoothFactor: 0, // no simplification — exact OSRM coordinates
      lineJoin: 'round',
      lineCap: 'round',
    };
    // White border underneath for road-map feel
    this.routePolylineBorder = L.polyline(points, {
      ...sharedOpts,
      color: '#ffffff',
      weight: 9,
      opacity: 0.55,
    }).addTo(this.map);
    // Blue route on top
    this.routePolyline = L.polyline(points, {
      ...sharedOpts,
      color: '#2563eb',
      weight: 5,
      opacity: 0.92,
    }).addTo(this.map);
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
  }

  /** Place start (green) and end (red) endpoint markers */
  setRouteEndpoints(start: [number, number], end: [number, number]): void {
    if (this.routeStartMarker) {
      this.map.removeLayer(this.routeStartMarker);
    }
    if (this.routeEndMarker) {
      this.map.removeLayer(this.routeEndMarker);
    }

    this.routeStartMarker = L.circleMarker(start, {
      radius: 9,
      fillColor: '#22c55e',
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    })
      .bindTooltip('Start', { permanent: false })
      .addTo(this.map);

    this.routeEndMarker = L.circleMarker(end, {
      radius: 9,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    })
      .bindTooltip('End', { permanent: false })
      .addTo(this.map);
  }

  /** Show incidents on route with pulsing category-icon markers */
  markRouteIncidents(incidents: RouteIncidentDto[]): void {
    this.routeIncidentLayer.clearLayers();
    for (const inc of incidents) {
      const icon = this.createRouteIncidentIcon(inc.categoryName);
      L.marker([inc.latitude, inc.longitude], { icon })
        .bindPopup(this.buildRouteIncidentPopup(inc), {
          maxWidth: 260,
          className: 'incident-popup',
        })
        .addTo(this.routeIncidentLayer);
    }
  }

  /** Remove route polyline, endpoint markers, and route incidents */
  clearRoute(): void {
    if (this.routePolylineBorder) {
      this.map.removeLayer(this.routePolylineBorder);
      this.routePolylineBorder = null;
    }
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    if (this.routeStartMarker) {
      this.map.removeLayer(this.routeStartMarker);
      this.routeStartMarker = null;
    }
    if (this.routeEndMarker) {
      this.map.removeLayer(this.routeEndMarker);
      this.routeEndMarker = null;
    }
    this.routeIncidentLayer.clearLayers();
  }

  addIncidentMarker(request: CreateIncidentRequest): string {
    const localId = crypto.randomUUID();
    const pending = { request, localId, createdAt: new Date() };
    this.pendingMap.set(localId, pending);

    const style = getCategoryStyle(request.categoryId);
    const icon = this.createCategoryIcon(style, true);
    const popup = this.buildPendingPopup(pending);

    const marker = L.marker([request.latitude, request.longitude], { icon })
      .addTo(this.map)
      .bindPopup(popup, { maxWidth: 340, minWidth: 280, className: 'incident-popup' })
      .openPopup();

    this.markerMap.set(localId, marker);
    return localId;
  }

  removeIncidentMarker(localId: string): void {
    const marker = this.markerMap.get(localId);
    if (marker) {
      this.map.removeLayer(marker);
      this.markerMap.delete(localId);
      this.pendingMap.delete(localId);
    }
  }

  /* ── Private ──────────────────────────────── */

  /** Backend'den gelen tüm incident'ları haritaya çiz */
  private renderIncidents(incidents: IncidentResponse[]): void {
    // ✅ extra guard
    if (!Array.isArray(incidents)) return;
    this.incidentLayer.clearLayers();
    this.incidentMarkerById.clear();

    for (const inc of incidents) {
      const style = getCategoryStyle(inc.categoryId);
      const icon = this.createCategoryIcon(style, false);
      const popup = this.buildIncidentPopup(inc, style);

      const marker = L.marker([inc.latitude, inc.longitude], { icon })
        .bindPopup(popup, { maxWidth: 340, minWidth: 280, className: 'incident-popup' })
        .addTo(this.incidentLayer);

      this.incidentMarkerById.set(inc.id, marker);
    }
  }

  /**
   * Incident ID ile haritayı o noktaya uçurur ve popup'ını açar.
   */
  public openIncidentById(incidentId: string, zoom: number = 17): boolean {
    const marker = this.incidentMarkerById.get(incidentId);
    if (!marker) return false;

    const { lat, lng } = marker.getLatLng();
    this.map.flyTo([lat, lng], zoom, { duration: 0.8 });

    // flyTo animasyonu bittikten sonra popup aç
    this.map.once('moveend', () => {
      marker.openPopup();
    });

    return true;
  }

  /** Confirmed incident popup */
  private buildIncidentPopup(
    inc: IncidentResponse,
    style: { icon: string; color: string },
  ): string {
    const title = inc.title?.trim() || inc.categoryName;
    const timeAgo = this.getTimeAgo(new Date(inc.createdAt));
    const statusColor: Record<string, string> = {
      Pending: '#f97316',
      Verified: '#22c55e',
      Disputed: '#ef4444',
      Resolved: '#64748b',
    };

    return `
      <div style="font-family:system-ui,sans-serif;min-width:260px;max-width:320px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="width:40px;height:40px;border-radius:10px;
                       background:${style.color}18;color:${style.color};
                       display:flex;align-items:center;justify-content:center;
                       font-size:1.15rem;flex-shrink:0;">
            <i class="fas ${style.icon}"></i>
          </span>
          <div style="flex:1;">
            <strong style="font-size:0.95rem;display:block;">${title}</strong>
            <span style="font-size:0.68rem;color:#94a3b8;">${inc.categoryName} · ${timeAgo}</span>
          </div>
          <span style="font-size:0.7rem;color:${statusColor[inc.status] ?? '#94a3b8'};font-weight:600;
                       background:${statusColor[inc.status] ?? '#94a3b8'}18;
                       padding:2px 8px;border-radius:4px;">
            ${inc.status}
          </span>
        </div>

        ${
          inc.description
            ? `
          <p style="margin:0 0 10px;font-size:0.8125rem;color:#374151;line-height:1.5;">
            ${inc.description}
          </p>`
            : ''
        }

        <div data-inspect-id="${inc.id}"
          style="display:flex;gap:12px;font-size:0.75rem;color:#64748b;
                 padding:6px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;
                 margin-bottom:6px;cursor:pointer;transition:background .15s;border-radius:6px;"
          onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
          <span style="display:flex;align-items:center;gap:4px;">
            <i class="fas fa-shield-alt" style="color:#22c55e;"></i> ${inc.positiveVerifications}
          </span>
          <span style="display:flex;align-items:center;gap:4px;">
            <i class="fas fa-flag" style="color:#ef4444;"></i> ${inc.negativeVerifications}
          </span>
          <span style="display:flex;align-items:center;gap:4px;">
            <i class="fas fa-comment" style="color:#3b82f6;"></i> ${inc.commentCount}
          </span>
          <span style="margin-left:auto;color:#3b82f6;font-weight:600;display:flex;align-items:center;gap:3px;">
            <i class="fas fa-search"></i> Inspect
          </span>
        </div>

        <div style="font-size:0.65rem;color:#94a3b8;">
          <i class="fas fa-map-pin"></i>
          ${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}
        </div>
      </div>`;
  }

  private createCategoryIcon(
    style: { icon: string; color: string },
    isPending: boolean,
  ): L.DivIcon {
    const opacity = isPending ? '0.7' : '1';
    return L.divIcon({
      className: 'custom-incident-marker',
      html: `
        <div style="
          width:38px;height:38px;border-radius:50%;
          background:${style.color};
          opacity:${opacity};
          display:flex;align-items:center;justify-content:center;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          position:relative;">
          <i class="fas ${style.icon}" style="color:#fff;font-size:16px;"></i>
          <div style="
            position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:8px solid ${style.color};">
          </div>
        </div>`,
      iconSize: [38, 45],
      iconAnchor: [19, 45],
      popupAnchor: [0, -42],
    });
  }

  private buildPendingPopup(pending: { request: CreateIncidentRequest; createdAt: Date }): string {
    const { request, createdAt } = pending;
    const style = getCategoryStyle(request.categoryId);
    const timeAgo = this.getTimeAgo(createdAt);
    const title = request.title?.trim() || 'Incident';

    return `
      <div style="font-family:system-ui,sans-serif;min-width:260px;max-width:320px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="width:40px;height:40px;border-radius:10px;
                       background:${style.color}18;color:${style.color};
                       display:flex;align-items:center;justify-content:center;font-size:1.15rem;">
            <i class="fas ${style.icon}"></i>
          </span>
          <div style="flex:1;">
            <strong style="font-size:0.95rem;display:block;">${title}</strong>
            <span style="font-size:0.68rem;color:#94a3b8;">${timeAgo}</span>
          </div>
          <span style="font-size:0.7rem;color:#f97316;font-weight:600;
                       background:#fff7ed;padding:2px 8px;border-radius:4px;">
            Pending…
          </span>
        </div>
        ${
          request.description
            ? `
          <p style="margin:0 0 10px;font-size:0.8125rem;color:#374151;line-height:1.5;">
            ${request.description}
          </p>`
            : ''
        }
        <div style="font-size:0.65rem;color:#94a3b8;padding-top:6px;border-top:1px solid #f1f5f9;">
          <i class="fas fa-map-pin"></i>
          ${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}
        </div>
      </div>`;
  }

  private registerMapClick(): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = this.routePickMode();
      if (mode !== 'none') {
        this.routePointPick.emit({ mode, lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (this.selectionMode()) {
        this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer().nativeElement, {
      center: [this.centerLat(), this.centerLng()],
      zoom: this.zoom(),
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>' },
    ).addTo(this.map);

    this.incidentLayer.addTo(this.map);
    this.routeIncidentLayer.addTo(this.map);
  }

  private createRouteIncidentIcon(categoryName: string): L.DivIcon {
    const style = getCategoryStyleByName(categoryName);
    return L.divIcon({
      className: 'route-incident-marker',
      html: `
        <div style="
          width:38px;height:38px;border-radius:50%;
          background:${style.color};
          border:3px solid #fff;
          box-shadow:0 0 0 4px ${style.color}, 0 2px 10px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          animation:route-pulse 1.4s ease-in-out infinite;
          position:relative;">
          <i class="fas ${style.icon}" style="color:#fff;font-size:15px;"></i>
          <div style="
            position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:9px solid ${style.color};">
          </div>
        </div>`,
      iconSize: [38, 47],
      iconAnchor: [19, 47],
      popupAnchor: [0, -44],
    });
  }

  private buildRouteIncidentPopup(inc: RouteIncidentDto): string {
    return `
      <div style="font-family:system-ui,sans-serif;min-width:190px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="background:#f9731620;color:#fb923c;padding:2px 8px;
                       border-radius:4px;font-size:0.7rem;font-weight:700;">
            ⚠️ On Your Route
          </span>
        </div>
        <strong style="font-size:0.875rem;display:block;margin-bottom:3px;">
          ${inc.title || inc.categoryName}
        </strong>
        <span style="font-size:0.72rem;color:#94a3b8;">${inc.categoryName}</span>
        <div style="font-size:0.68rem;color:#64748b;margin-top:6px;padding-top:6px;
                    border-top:1px solid #f1f5f9;">
          <i class="fas fa-map-pin"></i>
          ${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}
        </div>
      </div>`;
  }

  private showHeatmap(): void {
    const points = this.heatPoints();
    if (!points.length) return;

    const data: Array<[number, number, number]> = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity ?? 0.5,
    ]);

    this.heatLayer = (L as any)
      .heatLayer(data, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.4,
        gradient: {
          0.2: '#ffffb2',
          0.4: '#fecc5c',
          0.6: '#fd8d3c',
          0.8: '#f03b20',
          1.0: '#bd0026',
        },
      })
      .addTo(this.map);
  }

  private registerPopupActions(): void {
    this.map.on('popupopen', () => {
      document.querySelectorAll('[data-inspect-id]').forEach((el) => {
        const row = el as HTMLElement;
        row.addEventListener('click', () => {
          const id = row.dataset['inspectId']!;
          this.ngZone.run(() => {
            const incident = this.incidents().find((i) => i.id === id);
            if (incident) {
              this.map.closePopup();
              this.inspectIncident.emit(incident);
            }
          });
        });
      });
    });
  }

  private getTimeAgo(date: Date): string {
    const diffMs = new Date().getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  }

  public flyTo(lat: number, lng: number, zoom: number = 17): void {
    if (!this.map) return;

    // Leaflet-style
    if (typeof this.map.flyTo === 'function') {
      this.map.flyTo([lat, lng], zoom, { duration: 0.8 });
      return;
    }

    // Fallback
    if (typeof this.map.setView === 'function') {
      this.map.setView([lat, lng], zoom);
    }
  }
}
