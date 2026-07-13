import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'logired_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.readInitialMode());

  constructor() {
    this.applyToDocument(this.mode());
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.applyToDocument(mode);
  }

  private applyToDocument(mode: ThemeMode): void {
    const root = document.documentElement;
    // Evita que elementos con `transition` (color/background-color) se queden
    // pegados en el color anterior cuando el cambio llega vía una custom
    // property heredada en vez de la propiedad en sí. Ver styles.css.
    root.classList.add('theme-swap');
    root.setAttribute('data-theme', mode);
    void root.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-swap'));
    });
  }

  private readInitialMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
