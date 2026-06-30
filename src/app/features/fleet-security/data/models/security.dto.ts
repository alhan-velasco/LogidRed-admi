export interface LegalAuditTripDTO {
  id_trip: number;
  id_driver: number;
  plate_number: string;
  startup_time: string;
  end_time: string;
  status: 'Completado' | 'Alerta de Desvío' | 'En Ruta' | 'Bajo Investigación';
  case_incident_code: string;
}

export interface DriverHistoricalIdentityDTO {
  id_user: number;
  full_name: string;
  verified_phone: string;
  official_email: string;
  identity_card_url: string;
  background_check_status: 'Aprobado' | 'En Revisión' | 'Alerta';
  criminal_record_status: string;
  driver_avatar_url?: string;
}

export interface VehicleAuditDTO {
  id_car: number;
  brand: string;
  model: string;
  color: string;
  current_plates: string;
  serial_number: string; // VIN
  insurance_policy_number: string;
}

export interface TripRoutePointDTO {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  event_type: 'Inicio' | 'GPS_Update' | 'Exceso_Velocidad' | 'Desvío' | 'Fin';
  alert_description?: string;
}
