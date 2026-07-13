import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityState } from '../../state/security.state';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { NavbarComponent } from '../../../../../core/layout/navbar/navbar.component';
import { PrivateImageComponent } from '../../../../../shared/private-image/private-image.component';
import { RouteMapComponent } from '../../../../../shared/route-map/route-map.component';
import { RideRecord, getRideId, getRideStatusLabel, toDisplayEntries } from '../../../data/models/security.dto';

@Component({
  selector: 'app-security-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, PrivateImageComponent, RouteMapComponent],
  providers: [SecurityState],
  templateUrl: './security-panel.component.html',
})
export class SecurityPanelComponent implements OnInit {
  readonly state = inject(SecurityState);
  readonly session = inject(AuthSessionService);

  readonly showBlockModal = signal<boolean>(false);
  readonly blockReason = signal<string>('');

  ngOnInit(): void {
    this.state.loadDrivers();
  }

  getRideId(ride: RideRecord): number | null {
    return getRideId(ride);
  }

  getRideStatusLabel(ride: RideRecord): string {
    return getRideStatusLabel(ride);
  }

  entriesOf(record: Record<string, unknown> | RideRecord | null): Array<{ key: string; value: string }> {
    return toDisplayEntries(record);
  }

  // ── Bloqueo / desbloqueo (reusa approve/reject de la validación) ─────
  openBlockModal(): void {
    this.blockReason.set('');
    this.showBlockModal.set(true);
  }

  cancelBlock(): void {
    this.showBlockModal.set(false);
    this.blockReason.set('');
  }

  confirmBlock(): void {
    if (!this.blockReason().trim()) return;
    this.state.blockDriver(this.blockReason().trim());
    this.showBlockModal.set(false);
    this.blockReason.set('');
  }

  /** Genera y descarga un reporte de texto con todos los datos reales cargados del conductor seleccionado. */
  downloadDriverReport(): void {
    const detail = this.state.selectedDriverDetail();
    const profile = this.state.selectedDriverProfile();
    if (!detail) {
      alert('Selecciona un conductor para generar el reporte.');
      return;
    }

    const lines: string[] = [];
    lines.push('========================================================================');
    lines.push('        LOGIRED - EXPEDIENTE DE SEGURIDAD Y AUDITORÍA DEL CONDUCTOR');
    lines.push('========================================================================');
    lines.push(`FECHA DE EMISIÓN: ${new Date().toLocaleString()}`);
    lines.push(`SOLICITADO POR: ${this.session.getUserName()} (${this.session.getUserEmail()})`);
    lines.push('========================================================================');
    lines.push('');
    lines.push('1. IDENTIDAD DEL CONDUCTOR');
    lines.push('------------------------------------------------------------------------');
    lines.push(`- ID Usuario: ${detail.id_user}`);
    lines.push(`- Nombre: ${detail.name} ${detail.lastname}`);
    lines.push(`- Correo: ${detail.email}`);
    lines.push(`- Teléfono: ${detail.numberphone}`);
    lines.push(`- Fecha de nacimiento: ${detail.birthdate || 'Sin registro'}`);
    lines.push(`- Aprobado: ${detail.approved ? 'Sí' : 'No'}`);
    if (profile) {
      lines.push(`- Calificación global: ${profile.global_rating} (${profile.total_reviews} reseñas)`);
    }
    lines.push('');

    if (detail.cars?.length) {
      lines.push('2. VEHÍCULOS REGISTRADOS');
      lines.push('------------------------------------------------------------------------');
      detail.cars.forEach((car, idx) => {
        lines.push(`  Vehículo #${idx + 1}: ${car.brand} ${car.model} — Color ${car.color}`);
        lines.push(`    Placas: ${car.car_registration} | Capacidad: ${car.max_capacity}`);
      });
      lines.push('');
    }

    const stats = this.state.selectedDriverStatistics();
    if (stats) {
      lines.push('3. ESTADÍSTICAS DE VIAJES DEL CONDUCTOR');
      lines.push('------------------------------------------------------------------------');
      for (const entry of toDisplayEntries(stats)) {
        lines.push(`- ${entry.key}: ${entry.value}`);
      }
      lines.push('');
    }

    const trips = this.state.driverTrips();
    if (trips.length) {
      lines.push('4. VIAJES (página actual)');
      lines.push('------------------------------------------------------------------------');
      trips.forEach((ride, idx) => {
        lines.push(`  Viaje #${idx + 1} — ID ${getRideId(ride)} — ${getRideStatusLabel(ride)}`);
      });
      lines.push('');
    }

    const tracking = this.state.selectedTripTracking();
    if (tracking.length) {
      lines.push(`5. TELEMETRÍA GPS DEL VIAJE #${this.state.selectedTripId()}`);
      lines.push('------------------------------------------------------------------------');
      tracking.forEach((point, idx) => {
        lines.push(`  Punto ${idx + 1}:`);
        for (const entry of toDisplayEntries(point)) {
          lines.push(`    ${entry.key}: ${entry.value}`);
        }
      });
      lines.push('');
    }

    lines.push('========================================================================');
    lines.push('ESTE DOCUMENTO SE GENERÓ CON DATOS OBTENIDOS DIRECTAMENTE DE LA API DE LOGIRED.');
    lines.push('========================================================================');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expediente_Conductor_${detail.id_user}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
