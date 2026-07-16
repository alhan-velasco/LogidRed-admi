import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartEntry, ChartStatus } from '../../features/fleet-security/data/models/security.dto';

const STATUS_COLOR_VAR: Record<ChartStatus, string> = {
  good: 'var(--chart-good)',
  warning: 'var(--chart-warning)',
  critical: 'var(--chart-critical)',
  neutral: 'var(--chart-neutral)',
};

/**
 * Gráfica de barras horizontales genérica para estadísticas cuyo esquema no
 * está tipado por el backend (ver security.dto.ts). Cada barra se colorea por
 * el significado semántico de su propia etiqueta (completado=verde,
 * cancelado=rojo, pendiente=ámbar, otro=azul neutro) — paleta validada con
 * el validador de contraste/CVD de la skill de dataviz.
 */
@Component({
  selector: 'app-stat-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (entries().length) {
      <div class="space-y-3">
        @for (entry of entries(); track entry.label) {
          <div class="flex items-center gap-3">
            <span class="w-28 shrink-0 truncate text-xs text-on-surface-variant" [title]="entry.label">{{ entry.label }}</span>
            <div class="h-5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
              <div
                class="h-full rounded-full transition-[width] duration-500 ease-out"
                [style.width.%]="widthPct(entry.value)"
                [style.background-color]="colorFor(entry.status)"
              ></div>
            </div>
            <span class="w-10 shrink-0 text-right text-xs font-semibold text-on-surface">{{ entry.value }}</span>
          </div>
        }
      </div>
    } @else {
      <p class="text-xs text-on-surface-variant">Sin datos numéricos para graficar.</p>
    }
  `,
})
export class StatBarChartComponent {
  @Input() set data(value: ChartEntry[] | null | undefined) {
    this.entries.set(value ?? []);
  }

  readonly entries = signal<ChartEntry[]>([]);

  readonly maxValue = computed(() => Math.max(1, ...this.entries().map((e) => e.value)));

  widthPct(value: number): number {
    return Math.max(2, (value / this.maxValue()) * 100);
  }

  colorFor(status: ChartStatus): string {
    return STATUS_COLOR_VAR[status];
  }
}
