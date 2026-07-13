import { Injectable } from '@angular/core';
import { GOOGLE_MAPS_API_KEY } from '../config/api.config';

declare global {
  interface Window {
    google?: any;
  }
}

/** Inyecta el script de Google Maps JavaScript API una sola vez y reutiliza la misma promesa en llamadas posteriores. */
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (window.google?.maps) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps.'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
