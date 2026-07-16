import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageLightboxService } from './image-lightbox.service';

/**
 * Visor flotante global: cualquier imagen (foto de perfil, documento privado,
 * fotos de vehículo) se abre en grande aquí llamando a ImageLightboxService.open().
 * Se monta una sola vez en la raíz de la app (app.html).
 */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (lightbox.isOpen()) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-10"
        (click)="lightbox.close()"
      >
        <button
          type="button"
          (click)="lightbox.close(); $event.stopPropagation()"
          class="absolute right-4 top-4 md:right-6 md:top-6 text-white/80 hover:text-white transition bg-transparent border-0 cursor-pointer"
          aria-label="Cerrar"
        >
          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        @if (lightbox.images().length > 1) {
          <button
            type="button"
            (click)="lightbox.prev(); $event.stopPropagation()"
            class="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition bg-black/30 hover:bg-black/50 rounded-full p-2 border-0 cursor-pointer"
            aria-label="Anterior"
          >
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            (click)="lightbox.next(); $event.stopPropagation()"
            class="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition bg-black/30 hover:bg-black/50 rounded-full p-2 border-0 cursor-pointer"
            aria-label="Siguiente"
          >
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        }

        <img
          [src]="lightbox.images()[lightbox.index()]"
          alt=""
          class="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          (click)="$event.stopPropagation()"
        />

        @if (lightbox.images().length > 1) {
          <div class="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/90">
            {{ lightbox.index() + 1 }} / {{ lightbox.images().length }}
          </div>
        }
      </div>
    }
  `,
})
export class ImageLightboxComponent {
  readonly lightbox = inject(ImageLightboxService);

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightbox.isOpen()) return;
    if (event.key === 'Escape') this.lightbox.close();
    if (event.key === 'ArrowRight') this.lightbox.next();
    if (event.key === 'ArrowLeft') this.lightbox.prev();
  }
}
