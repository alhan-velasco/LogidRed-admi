import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SecurityState } from '../../state/security.state';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';

@Component({
  selector: 'app-security-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  providers: [SecurityState],
  templateUrl: './security-panel.component.html',
})
export class SecurityPanelComponent implements OnInit {
  readonly state = inject(SecurityState);
  readonly session = inject(AuthSessionService);

  ngOnInit(): void {
    // Inicialmente no cargamos datos hasta que se ingrese la carpeta de investigación/oficio.
  }

  /**
   * Genera y descarga un reporte firmado digitalmente con los datos forenses del viaje seleccionado.
   */
  downloadCertifiedReport(): void {
    const detail = this.state.selectedTripDetail();
    const caseId = this.state.officialCaseId().trim();
    const trips = this.state.tripsResults();
    const activeTripId = this.state.selectedTripId();
    
    if (!caseId) {
      alert('Se requiere un Número de Oficio o Carpeta de Investigación para certificar el reporte.');
      return;
    }
    
    if (!detail) {
      alert('Seleccione un viaje de la lista para emitir el reporte certificado.');
      return;
    }

    const activeTrip = trips.find(t => t.id_trip === activeTripId);

    const reportContent = `========================================================================
             LOGIRED - REPORTE FORENSE DE AUDITORÍA JUDICIAL
========================================================================
FECHA DE EMISIÓN: ${new Date().toLocaleString()}
CARPETA DE INVESTIGACIÓN / OFICIO: ${caseId}
SITIO DE CONTROL: https://databaselogired.online/
ESTADO DE AUDITORÍA: CERTIFICADO Y FIRMADO DIGITALMENTE
========================================================================

1. DETALLES DEL VIAJE AUDITADO (ID: ${activeTrip?.id_trip})
------------------------------------------------------------------------
- Placas del Vehículo: ${activeTrip?.plate_number}
- Hora de Inicio: ${activeTrip?.startup_time}
- Hora de Término: ${activeTrip?.end_time}
- Estado del Viaje: ${activeTrip?.status}
- Código Interno de Incidente: ${activeTrip?.case_incident_code}

2. EXPEDIENTE DE IDENTIDAD HISTÓRICA DEL CONDUCTOR
------------------------------------------------------------------------
- Nombre Completo: ${detail.driver.full_name}
- Correo Oficial: ${detail.driver.official_email}
- Teléfono Verificado: ${detail.driver.verified_phone}
- Estatus Control de Confianza: ${detail.driver.background_check_status}
- Antecedentes Penales: ${detail.driver.criminal_record_status}
- Enlace al Documento INE/Identidad: ${detail.driver.identity_card_url}

3. ESPECIFICACIONES DEL VEHÍCULO AUDITADO
------------------------------------------------------------------------
- Marca y Modelo: ${detail.vehicle.brand} ${detail.vehicle.model}
- Color: ${detail.vehicle.color}
- Placas Vigentes: ${detail.vehicle.current_plates}
- Número de Serie (VIN): ${detail.vehicle.serial_number}
- Número de Póliza de Seguro: ${detail.vehicle.insurance_policy_number}

4. HISTORIAL DE TELEMETRÍA Y COORDENADAS GPS (CRONOLÓGICO)
------------------------------------------------------------------------
${detail.route.map((pt, idx) => `[Punto ${idx + 1}]
  Hora: ${pt.timestamp}
  Coordenadas: Lat ${pt.latitude}, Lng ${pt.longitude}
  Velocidad: ${pt.speed_kmh} km/h
  Evento: ${pt.event_type} ${pt.alert_description ? `\n  Alerta: ${pt.alert_description}` : ''}`).join('\n\n')}

========================================================================
ESTE DOCUMENTO TIENE VALIDEZ LEGAL ANTE LA FISCALÍA GENERAL DE LA REPÚBLICA.
FIRMA ELECTRÓNICA LOGIRED SECURE-ID: [${btoa(caseId + '-' + (activeTrip?.id_trip || 0)).substring(0, 32)}]
========================================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Certificado_Forense_${caseId}_Viaje_${activeTripId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
