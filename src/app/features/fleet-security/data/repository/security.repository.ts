import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  LegalAuditTripDTO, 
  DriverHistoricalIdentityDTO, 
  VehicleAuditDTO, 
  TripRoutePointDTO 
} from '../models/security.dto';

@Injectable({
  providedIn: 'root'
})
export class SecurityRepository {
  // Simulación de base de datos en la URL oficial: https://databaselogired.online/security
  private readonly mockTrips: LegalAuditTripDTO[] = [
    {
      id_trip: 2045,
      id_driver: 301,
      plate_number: 'MX-982-AS',
      startup_time: '2026-06-29T14:30:00Z',
      end_time: '2026-06-29T18:15:00Z',
      status: 'Alerta de Desvío',
      case_incident_code: 'INC-2026-9081'
    },
    {
      id_trip: 2046,
      id_driver: 302,
      plate_number: 'ED-551-BG',
      startup_time: '2026-06-29T16:00:00Z',
      end_time: '2026-06-29T21:40:00Z',
      status: 'Completado',
      case_incident_code: 'INC-2026-4432'
    },
    {
      id_trip: 2047,
      id_driver: 303,
      plate_number: 'NL-203-YT',
      startup_time: '2026-06-30T01:10:00Z',
      end_time: '2026-06-30T05:30:00Z',
      status: 'Bajo Investigación',
      case_incident_code: 'INC-2026-8811'
    },
    {
      id_trip: 2048,
      id_driver: 304,
      plate_number: 'MX-714-KH',
      startup_time: '2026-06-30T03:00:00Z',
      end_time: '2026-06-30T06:50:00Z',
      status: 'Completado',
      case_incident_code: 'INC-2026-1029'
    }
  ];

  private readonly mockDrivers: Record<number, DriverHistoricalIdentityDTO> = {
    301: {
      id_user: 301,
      full_name: 'Carlos Mendoza Ruiz',
      verified_phone: '+52 55 4321 0987',
      official_email: 'carlos.mendoza@logired.online',
      identity_card_url: 'https://databaselogired.online/documents/ine_301.pdf',
      background_check_status: 'Alerta',
      criminal_record_status: 'Historial de Desvío detectado en auditorías previas de la fiscalía.',
      driver_avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'
    },
    302: {
      id_user: 302,
      full_name: 'Alejandro Gómez Silva',
      verified_phone: '+52 55 9876 5432',
      official_email: 'alejandro.gomez@logired.online',
      identity_card_url: 'https://databaselogired.online/documents/ine_302.pdf',
      background_check_status: 'Aprobado',
      criminal_record_status: 'Sin antecedentes penales vigentes a nivel federal.',
      driver_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'
    },
    303: {
      id_user: 303,
      full_name: 'Martín Cabrera Torres',
      verified_phone: '+52 81 1234 5678',
      official_email: 'martin.cabrera@logired.online',
      identity_card_url: 'https://databaselogired.online/documents/ine_303.pdf',
      background_check_status: 'En Revisión',
      criminal_record_status: 'Pendiente de validación de carta de no antecedentes del Estado de Nuevo León.',
      driver_avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=160&q=80'
    },
    304: {
      id_user: 304,
      full_name: 'Sofía Valenzuela Neri',
      verified_phone: '+52 55 1122 3344',
      official_email: 'sofia.valenzuela@logired.online',
      identity_card_url: 'https://databaselogired.online/documents/ine_304.pdf',
      background_check_status: 'Aprobado',
      criminal_record_status: 'Sin antecedentes penales. Control de confianza aprobado.',
      driver_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
    }
  };

  private readonly mockVehicles: Record<number, VehicleAuditDTO> = {
    2045: {
      id_car: 501,
      brand: 'Kenworth',
      model: 'T680 (2022)',
      color: 'Gris Grafito',
      current_plates: 'MX-982-AS',
      serial_number: '1NKWD49X3NF827104',
      insurance_policy_number: 'QUALITAS-992-0091-B'
    },
    2046: {
      id_car: 502,
      brand: 'Freightliner',
      model: 'Cascadia (2021)',
      color: 'Blanco Perlado',
      current_plates: 'ED-551-BG',
      serial_number: '1FVAC59D2NF661023',
      insurance_policy_number: 'GNP-8831-LL-09'
    },
    2047: {
      id_car: 503,
      brand: 'Volvo',
      model: 'VNL 860 (2023)',
      color: 'Rojo Metálico',
      current_plates: 'NL-203-YT',
      serial_number: '4V4NC9EJ7ND002931',
      insurance_policy_number: 'AXA-SEGURIDAD-8821'
    },
    2048: {
      id_car: 504,
      brand: 'International',
      model: 'ProStar (2020)',
      color: 'Azul Marino',
      current_plates: 'MX-714-KH',
      serial_number: '1HSCZAP92KL012831',
      insurance_policy_number: 'MAPFRE-UX-2810'
    }
  };

  private readonly mockRoutes: Record<number, TripRoutePointDTO[]> = {
    2045: [
      { timestamp: '14:30', latitude: 19.432608, longitude: -99.133209, speed_kmh: 0, event_type: 'Inicio' },
      { timestamp: '15:10', latitude: 19.523421, longitude: -99.182103, speed_kmh: 82, event_type: 'GPS_Update' },
      { timestamp: '15:45', latitude: 19.684120, longitude: -99.245231, speed_kmh: 115, event_type: 'Exceso_Velocidad', alert_description: 'Excedió límite de 95 km/h para tractocamión pesado.' },
      { timestamp: '16:20', latitude: 19.821390, longitude: -99.301290, speed_kmh: 45, event_type: 'Desvío', alert_description: 'Salida no autorizada de la autopista federal 57D hacia brecha de terracería.' },
      { timestamp: '17:05', latitude: 19.805120, longitude: -99.281140, speed_kmh: 12, event_type: 'GPS_Update', alert_description: 'Detención prolongada de 20 minutos fuera de paradero seguro.' },
      { timestamp: '18:15', latitude: 19.892011, longitude: -99.351020, speed_kmh: 0, event_type: 'Fin' }
    ],
    2046: [
      { timestamp: '16:00', latitude: 19.432608, longitude: -99.133209, speed_kmh: 0, event_type: 'Inicio' },
      { timestamp: '17:30', latitude: 19.882103, longitude: -99.412390, speed_kmh: 88, event_type: 'GPS_Update' },
      { timestamp: '19:00', latitude: 20.293481, longitude: -99.821901, speed_kmh: 90, event_type: 'GPS_Update' },
      { timestamp: '20:30', latitude: 20.601931, longitude: -100.392019, speed_kmh: 85, event_type: 'GPS_Update' },
      { timestamp: '21:40', latitude: 20.723120, longitude: -100.442102, speed_kmh: 0, event_type: 'Fin' }
    ],
    2047: [
      { timestamp: '01:10', latitude: 25.686614, longitude: -100.316113, speed_kmh: 0, event_type: 'Inicio' },
      { timestamp: '02:00', latitude: 25.823120, longitude: -100.412190, speed_kmh: 92, event_type: 'GPS_Update' },
      { timestamp: '03:15', latitude: 26.151239, longitude: -100.281290, speed_kmh: 118, event_type: 'Exceso_Velocidad', alert_description: 'Excedió límite de velocidad en zona de curvas.' },
      { timestamp: '04:30', latitude: 26.551021, longitude: -100.198210, speed_kmh: 75, event_type: 'GPS_Update' },
      { timestamp: '05:30', latitude: 26.892102, longitude: -100.082103, speed_kmh: 0, event_type: 'Fin' }
    ],
    2048: [
      { timestamp: '03:00', latitude: 19.432608, longitude: -99.133209, speed_kmh: 0, event_type: 'Inicio' },
      { timestamp: '04:15', latitude: 19.312093, longitude: -99.012391, speed_kmh: 78, event_type: 'GPS_Update' },
      { timestamp: '05:30', latitude: 19.123902, longitude: -98.789210, speed_kmh: 80, event_type: 'GPS_Update' },
      { timestamp: '06:50', latitude: 19.041239, longitude: -98.206230, speed_kmh: 0, event_type: 'Fin' }
    ]
  };

  /**
   * Busca viajes por placas o por el nombre del conductor.
   */
  searchTrips(query: string): Observable<LegalAuditTripDTO[]> {
    const term = query.toLowerCase().trim();
    if (!term) {
      return of(this.mockTrips).pipe(delay(600));
    }

    const filtered = this.mockTrips.filter(trip => {
      const matchPlates = trip.plate_number.toLowerCase().includes(term);
      const driver = this.mockDrivers[trip.id_driver];
      const matchDriver = driver ? driver.full_name.toLowerCase().includes(term) : false;
      return matchPlates || matchDriver;
    });

    return of(filtered).pipe(delay(600));
  }

  /**
   * Obtiene el expediente forense cruzado del viaje seleccionado.
   */
  getTripForensicDetail(idTrip: number): Observable<{ 
    driver: DriverHistoricalIdentityDTO; 
    vehicle: VehicleAuditDTO; 
    route: TripRoutePointDTO[]; 
  } | null> {
    const trip = this.mockTrips.find(t => t.id_trip === idTrip);
    if (!trip) {
      return of(null).pipe(delay(400));
    }

    const driver = this.mockDrivers[trip.id_driver];
    const vehicle = this.mockVehicles[trip.id_trip];
    const route = this.mockRoutes[trip.id_trip] || [];

    if (!driver || !vehicle) {
      return of(null).pipe(delay(400));
    }

    return of({ driver, vehicle, route }).pipe(delay(700));
  }

  /**
   * Registra y audita el acceso judicial a la base de datos de seguridad nacional.
   */
  logJudicialAccess(caseId: string): Observable<boolean> {
    console.info(`[AUDITORÍA FISCALÍA] Registrando acceso para carpeta/oficio: ${caseId} en https://databaselogired.online/audit-logs`);
    return of(true).pipe(delay(300));
  }
}
