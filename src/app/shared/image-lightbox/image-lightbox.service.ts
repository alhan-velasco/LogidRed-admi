import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageLightboxService {
  readonly images = signal<string[]>([]);
  readonly index = signal(0);
  readonly isOpen = signal(false);

  open(images: string[], startIndex = 0): void {
    const clean = images.filter(Boolean);
    if (clean.length === 0) return;
    this.images.set(clean);
    this.index.set(Math.min(Math.max(startIndex, 0), clean.length - 1));
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  next(): void {
    const total = this.images().length;
    if (total === 0) return;
    this.index.update((i) => (i + 1) % total);
  }

  prev(): void {
    const total = this.images().length;
    if (total === 0) return;
    this.index.update((i) => (i - 1 + total) % total);
  }
}
