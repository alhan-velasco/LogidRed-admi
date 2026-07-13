import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsLoaderService } from '../../core/maps/google-maps-loader.service';
import { RideRecord, getLatLng } from '../../features/fleet-security/data/models/security.dto';

declare const google: any;

/**
 * Dibuja sobre Google Maps la ruta que trazó un conductor durante un viaje,
 * a partir de los puntos crudos de GET /admin/rides/{id}/tracking. No asume
 * un nombre de campo fijo para las coordenadas (ver getLatLng); si ningún
 * punto trae lat/lng reconocible, se muestra un aviso en vez de un mapa vacío.
 */
@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative h-full w-full overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
      @if (errorMessage()) {
        <div class="flex h-full w-full items-center justify-center p-4 text-center text-xs text-on-surface-variant">
          {{ errorMessage() }}
        </div>
      } @else if (!ready()) {
        <div class="flex h-full w-full items-center justify-center text-xs text-on-surface-variant">Cargando mapa…</div>
      }
      <div #mapContainer class="h-full w-full" [class.hidden]="!ready() || errorMessage()"></div>
    </div>
  `,
})
export class RouteMapComponent implements OnChanges, OnDestroy {
  @Input() points: RideRecord[] = [];

  @ViewChild('mapContainer') private mapContainerRef?: ElementRef<HTMLDivElement>;

  private readonly loader = inject(GoogleMapsLoaderService);

  readonly ready = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private map: any = null;
  private polyline: any = null;
  private markers: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if ('points' in changes) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.clearOverlays();
  }

  private async render(): Promise<void> {
    const coords = this.points.map(getLatLng).filter((p): p is { lat: number; lng: number } => p !== null);

    if (coords.length === 0) {
      this.errorMessage.set('No se encontraron coordenadas GPS en la telemetría de este viaje.');
      return;
    }

    this.errorMessage.set(null);

    try {
      await this.loader.load();
    } catch {
      this.errorMessage.set('No se pudo cargar Google Maps.');
      return;
    }

    // Espera un tick a que Angular pinte el @if y exista #mapContainer en el DOM.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const container = this.mapContainerRef?.nativeElement;
    if (!container) {
      this.errorMessage.set('No se pudo inicializar el mapa.');
      return;
    }

    this.ready.set(true);
    this.clearOverlays();

    if (!this.map) {
      this.map = new google.maps.Map(container, {
        center: coords[0],
        zoom: 13,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
      });
    }

    this.polyline = new google.maps.Polyline({
      path: coords,
      geodesic: true,
      strokeColor: '#1d6b50',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map: this.map,
    });

    this.markers.push(
      new google.maps.Marker({
        position: coords[0],
        map: this.map,
        label: 'A',
        title: 'Inicio del viaje',
      })
    );

    if (coords.length > 1) {
      this.markers.push(
        new google.maps.Marker({
          position: coords[coords.length - 1],
          map: this.map,
          label: 'B',
          title: 'Fin del viaje',
        })
      );
    }

    const bounds = new google.maps.LatLngBounds();
    coords.forEach((c) => bounds.extend(c));
    this.map.fitBounds(bounds);
  }

  private clearOverlays(): void {
    this.polyline?.setMap(null);
    this.polyline = null;
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
  }
}
