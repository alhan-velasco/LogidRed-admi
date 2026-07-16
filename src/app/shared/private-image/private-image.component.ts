import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { ImageLightboxService } from '../image-lightbox/image-lightbox.service';

/**
 * Muestra un documento privado de Firebase Storage obtenido vía
 * GET /admin/documents/{id}/file (requiere Authorization: Bearer <token>).
 * Nunca se puede usar <img src="..."> directo con esa ruta porque el
 * navegador no manda el header Authorization: por eso se pide con
 * HttpClient (el interceptor global adjunta el token), se convierte a Blob
 * y se expone como Object URL, que se revoca al destruir/cambiar el componente.
 *
 * El estado se guarda en signals (no propiedades de clase sueltas): esta app
 * corre sin zone.js, así que mutar `this.foo` dentro de un callback de
 * HttpClient no dispara detección de cambios y la vista se queda pegada en
 * "Cargando...". Los signals sí notifican a Angular cuando se leen en la plantilla.
 */
@Component({
  selector: 'app-private-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="flex h-full w-full items-center justify-center text-[10px] text-on-surface-variant" [class]="containerClass">
        Cargando…
      </div>
    } @else if (errorMessage()) {
      <div class="flex h-full w-full flex-col items-center justify-center gap-1 text-center text-[10px] text-error" [class]="containerClass">
        <span>{{ errorMessage() }}</span>
      </div>
    } @else if (objectUrl()) {
      <img
        [src]="objectUrl()"
        [alt]="alt"
        [class]="imgClass"
        class="cursor-zoom-in"
        (click)="openLightbox()"
      />
    } @else {
      <div class="flex h-full w-full items-center justify-center text-[10px] text-on-surface-variant/60" [class]="containerClass">
        Sin documento
      </div>
    }
  `,
})
export class PrivateImageComponent implements OnChanges {
  @Input() documentId: number | null | undefined = null;
  @Input() alt = 'Documento';
  @Input() imgClass = 'h-full w-full object-cover';
  @Input() containerClass = 'bg-surface-container-high rounded-lg';

  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lightbox = inject(ImageLightboxService);

  readonly objectUrl = signal<string | null>(null);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.revoke());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('documentId' in changes) {
      this.load();
    }
  }

  private load(): void {
    this.revoke();
    this.errorMessage.set(null);

    if (this.documentId == null) {
      return;
    }

    this.loading.set(true);
    this.http
      .get(`${API_BASE_URL}/admin/documents/${this.documentId}/file`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          this.loading.set(false);
          this.objectUrl.set(URL.createObjectURL(blob));
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(this.mapError(err?.status));
          if (err?.status === 401) {
            this.session.clearSession();
            this.router.navigate(['/login']);
          }
        },
      });
  }

  openLightbox(): void {
    const url = this.objectUrl();
    if (url) {
      this.lightbox.open([url]);
    }
  }

  private mapError(status: number | undefined): string {
    switch (status) {
      case 401:
        return 'Sesión expirada';
      case 403:
        return 'Sin permiso para ver esto';
      case 404:
        return 'Documento no encontrado';
      default:
        return 'Error al cargar el documento';
    }
  }

  private revoke(): void {
    const current = this.objectUrl();
    if (current) {
      URL.revokeObjectURL(current);
      this.objectUrl.set(null);
    }
  }
}
