import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityState } from '../../state/security.state';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { NavbarComponent } from '../../../../../core/layout/navbar/navbar.component';
import { PrivateImageComponent } from '../../../../../shared/private-image/private-image.component';
import { RouteMapComponent } from '../../../../../shared/route-map/route-map.component';
import { StatBarChartComponent } from '../../../../../shared/stat-bar-chart/stat-bar-chart.component';
import { ImageLightboxService } from '../../../../../shared/image-lightbox/image-lightbox.service';
import { RideRecord, getRideId, getRideStatusLabel, toChartEntries, toDisplayEntries } from '../../../data/models/security.dto';
import { DriverDetailDTO, formatBirthdate } from '../../../../drivers-management/data/models/driver-panel.dto';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-security-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, PrivateImageComponent, RouteMapComponent, StatBarChartComponent],
  providers: [SecurityState],
  templateUrl: './security-panel.component.html',
})
export class SecurityPanelComponent implements OnInit {
  readonly state = inject(SecurityState);
  readonly session = inject(AuthSessionService);
  private readonly lightbox = inject(ImageLightboxService);

  readonly showBlockModal = signal<boolean>(false);
  readonly blockReason = signal<string>('');
  readonly showUnblockConfirmModal = signal<boolean>(false);

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

  chartEntriesOf(record: Record<string, unknown> | null): ReturnType<typeof toChartEntries> {
    return toChartEntries(record);
  }

  getApprovedByName(driver: DriverDetailDTO): string {
    const data = driver as DriverDetailDTO & Record<string, unknown>;
    const approval = data['approved_by'] ?? data['approvedBy'] ?? data['approver'] ?? data['approved_user'];

    if (typeof approval === 'string' && approval.trim()) return approval.trim();
    if (approval && typeof approval === 'object') {
      const approver = approval as Record<string, unknown>;
      const fullName = approver['full_name'] ?? approver['fullname'] ?? approver['name'];
      if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

      const firstName = typeof approver['first_name'] === 'string' ? approver['first_name'].trim() : '';
      const lastName = typeof (approver['last_name'] ?? approver['lastname']) === 'string'
        ? String(approver['last_name'] ?? approver['lastname']).trim()
        : '';
      if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    }

    const directName = data['approved_by_name'] ?? data['approver_name'] ?? data['approved_user_name'];
    return typeof directName === 'string' && directName.trim() ? directName.trim() : 'Sin registro';
  }

  formatBirthdate(value: string | null | undefined): string {
    return formatBirthdate(value);
  }

  openImage(url: string | undefined): void {
    if (!url) return;
    this.lightbox.open([url]);
  }

  // ── Bloqueo ──────────────────────────────────────────────────────────
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

  // ── Desbloqueo ───────────────────────────────────────────────────────
  openUnblockModal(): void {
    this.showUnblockConfirmModal.set(true);
  }

  cancelUnblock(): void {
    this.showUnblockConfirmModal.set(false);
  }

  confirmUnblock(): void {
    this.showUnblockConfirmModal.set(false);
    this.state.unblockDriver();
  }

  /** Genera un PDF independiente de la interfaz de administración. */
  downloadDriverReport(): void {
    const detail = this.state.selectedDriverDetail();
    const profile = this.state.selectedDriverProfile();
    if (!detail) {
      alert('Selecciona un conductor para generar el expediente.');
      return;
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    let y = 20;

    // Header with LogiRed branding
    pdf.setFillColor(13, 43, 66);
    pdf.rect(0, 0, pageWidth, 43, 'F');
        // Add brand logo (ensure assets/logired_logo.jpg exists)
    // Add brand logo from JPEG file
    pdf.addImage('assets/logired_logo.jpg', 'JPEG', margin, 8, 30, 15);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('LOGIRED', margin + 35, 20);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('EXPEDIENTE DE SEGURIDAD DEL CONDUCTOR', margin + 35, 29);
    pdf.setFontSize(8);
    pdf.text(`Emitido el ${new Date().toLocaleString('es-MX')}`, margin + 35, 35);


    y = 55;
    pdf.setTextColor(13, 43, 66);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(`${detail.name} ${detail.lastname}`, margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(92, 106, 120);
    pdf.text(`Conductor ID ${detail.id_user} | Estado: ${detail.approved ? 'Activo' : 'No activo'}`, margin, y);
    y += 12;

    y = this.addPdfSection(pdf, y, 'Información personal');
    y = this.addPdfField(pdf, y, 'Correo electrónico', detail.email);
    y = this.addPdfField(pdf, y, 'Teléfono', detail.numberphone);
    y = this.addPdfField(pdf, y, 'Fecha de nacimiento', formatBirthdate(detail.birthdate));
    y = this.addPdfField(pdf, y, 'Aprobado por', this.getApprovedByName(detail));
    if (profile) y = this.addPdfField(pdf, y, 'Calificación', `${profile.global_rating} / 5 (${profile.total_reviews} reseñas)`);

    y = this.addPdfSection(pdf, y + 4, 'Vehículos registrados');
    if (detail.cars?.length) {
      detail.cars.forEach((car, index) => {
        y = this.ensurePdfSpace(pdf, y, 16);
        pdf.setFillColor(244, 247, 249);
        pdf.roundedRect(margin, y - 4, pageWidth - margin * 2, 13, 2, 2, 'F');
        pdf.setTextColor(13, 43, 66);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(`${index + 1}. ${car.brand} ${car.model}`, margin + 4, y + 1);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(92, 106, 120);
        pdf.text(`Placas: ${car.car_registration || 'Sin registro'} | Color: ${car.color || 'Sin registro'} | Capacidad: ${car.max_capacity || 'Sin registro'}`, margin + 4, y + 6);
        y += 18;
      });
    } else {
      y = this.addPdfField(pdf, y, 'Registro', 'Sin vehículos registrados');
    }

    const stats = this.state.selectedDriverStatistics();
    if (stats) {
      y = this.addPdfSection(pdf, y + 2, 'Resumen operativo');
      for (const entry of toDisplayEntries(stats)) y = this.addPdfField(pdf, y, entry.key, entry.value);
    }

    const trips = this.state.driverTrips();
    if (trips.length) {
      y = this.addPdfSection(pdf, y + 2, 'Viajes recientes');
      trips.forEach((ride, index) => {
        y = this.ensurePdfSpace(pdf, y, 7);
        pdf.setTextColor(13, 43, 66);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`${index + 1}. Viaje ${getRideId(ride) ?? 'sin ID'} - ${getRideStatusLabel(ride)}`, margin, y);
        y += 6;
      });
    }

    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(217, 225, 231);
      pdf.line(margin, 286, pageWidth - margin, 286);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(110, 122, 133);
      pdf.text('Documento confidencial - Uso exclusivo de LogiRed', margin, 291);
      pdf.text(`Página ${page} de ${pages}`, pageWidth - margin, 291, { align: 'right' });
    }

    pdf.save(`Expediente_LogiRed_${detail.id_user}.pdf`);
  }

  private addPdfSection(pdf: jsPDF, y: number, title: string): number {
    y = this.ensurePdfSpace(pdf, y, 14);
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setDrawColor(20, 118, 137);
    pdf.setLineWidth(0.8);
    pdf.line(18, y, 25, y);
    pdf.setTextColor(13, 43, 66);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(title, 29, y + 1.5);
    pdf.setDrawColor(217, 225, 231);
    pdf.setLineWidth(0.2);
    pdf.line(29, y, pageWidth - 18, y);
    return y + 9;
  }

  private addPdfField(pdf: jsPDF, y: number, label: string, value: string | number): number {
    const lines = pdf.splitTextToSize(String(value || 'Sin registro'), 110) as string[];
    y = this.ensurePdfSpace(pdf, y, Math.max(7, lines.length * 4 + 3));
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(92, 106, 120);
    pdf.text(`${label}:`, 18, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(13, 43, 66);
    pdf.text(lines, 66, y);
    return y + Math.max(7, lines.length * 4 + 3);
  }

  private ensurePdfSpace(pdf: jsPDF, y: number, required: number): number {
    if (y + required <= 280) return y;
    pdf.addPage();
    return 22;
  }

  /** Legacy plain-text exporter retained temporarily for backward compatibility. */
  private downloadLegacyDriverReport(): void {
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
    lines.push(`- Fecha de nacimiento: ${formatBirthdate(detail.birthdate)}`);
    lines.push(`- Aprobado: ${detail.approved ? 'Sí' : 'No'}`);
    lines.push(`- Aprobado por: ${this.getApprovedByName(detail)}`);
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
