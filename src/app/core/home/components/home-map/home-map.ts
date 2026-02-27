import { Component, AfterViewInit, OnDestroy, OnInit, ElementRef, viewChild, inject } from '@angular/core';
import * as L from 'leaflet';
import { getCategoryStyle } from '../../../../shared/constants';
import { IncidentsService } from '../../../../shared/services/incidents.service';
import { IncidentResponse } from '../../../../models/incident.model';

@Component({
  selector: 'app-home-map',
  imports: [],
  templateUrl: './home-map.html',
  styleUrl: './home-map.css',
})
export class HomeMap implements AfterViewInit, OnInit, OnDestroy {
  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly incidentsService = inject(IncidentsService);

  private map!: L.Map;
  private incidentLayer = L.layerGroup();
  private incidents: IncidentResponse[] = [];

  ngOnInit(): void {
    this.incidentsService.getIncidents(1, 200).subscribe({
      next: (items) => {
        this.incidents = Array.isArray(items) ? items : [];
        if (this.map) {
          this.renderIncidents();
        }
      },
      error: () => { /* silently fail — map stays empty */ },
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement, {
      center: [36.8969, 30.7133],
      zoom: 13,
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
      keyboard: true,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(this.map);

    this.incidentLayer.addTo(this.map);

    // If data arrived before map init, render now
    if (this.incidents.length) {
      this.renderIncidents();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private renderIncidents(): void {
    this.incidentLayer.clearLayers();

    for (const inc of this.incidents) {
      const style = getCategoryStyle(inc.categoryId);

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:34px;height:34px;border-radius:50%;
            background:${style.color};
            display:flex;align-items:center;justify-content:center;
            border:2.5px solid #fff;
            box-shadow:0 3px 10px rgba(0,0,0,0.35);
          ">
            <i class="fas ${style.icon}" style="color:#fff;font-size:13px;"></i>
          </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([inc.latitude, inc.longitude], { icon })
        .addTo(this.incidentLayer)
        .bindTooltip(style.label, {
          direction: 'top',
          offset: [0, -20],
          className: 'home-map-tooltip',
        });
    }
  }
}
