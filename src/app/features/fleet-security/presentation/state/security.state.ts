import { Injectable, inject, signal, effect } from '@angular/core';
import { SecurityRepository } from '../../data/repository/security.repository';
import { 
  LegalAuditTripDTO, 
  DriverHistoricalIdentityDTO, 
  VehicleAuditDTO, 
  TripRoutePointDTO 
} from '../../data/models/security.dto';

@Injectable()
export class SecurityState {
  private readonly repository = inject(SecurityRepository);

  // Signals obligatorios del estado
  readonly searchQuery = signal<string>('');
  readonly officialCaseId = signal<string>('');
  readonly tripsResults = signal<LegalAuditTripDTO[]>([]);
  readonly selectedTripDetail = signal<{ 
    driver: DriverHistoricalIdentityDTO; 
    vehicle: VehicleAuditDTO; 
    route: TripRoutePointDTO[]; 
  } | null>(null);
  readonly isSearching = signal<boolean>(false);

  // Signals de soporte adicionales
  readonly errorMessage = signal<string | null>(null);
  readonly selectedTripId = signal<number | null>(null);

  constructor() {
    // Si se limpia el número de oficio, automáticamente revocamos los accesos y reseteamos el estado.
    effect(() => {
      const caseId = this.officialCaseId();
      if (!caseId.trim()) {
        this.clearState();
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Ejecuta la búsqueda de viajes bajo sospecha.
   * Está bloqueada si el 'officialCaseId' está vacío.
   */
  executeSearch(): void {
    const caseId = this.officialCaseId().trim();
    if (!caseId) {
      this.errorMessage.set('El número de oficio o carpeta de investigación es obligatorio para realizar consultas.');
      return;
    }

    this.errorMessage.set(null);
    this.isSearching.set(true);

    // Registrar en auditoría judicial el acceso primero
    this.repository.logJudicialAccess(caseId).subscribe({
      next: () => {
        // Ejecutar búsqueda por placas o conductor
        this.repository.searchTrips(this.searchQuery()).subscribe({
          next: (trips) => {
            this.tripsResults.set(trips);
            this.isSearching.set(false);

            // Si hay resultados y no hay viaje seleccionado, o el actual no está en la nueva lista, reseteamos el detalle
            const currentSelected = this.selectedTripId();
            if (trips.length > 0 && (!currentSelected || !trips.some(t => t.id_trip === currentSelected))) {
              this.selectTrip(trips[0].id_trip);
            } else if (trips.length === 0) {
              this.selectedTripDetail.set(null);
              this.selectedTripId.set(null);
            }
          },
          error: (err) => {
            this.errorMessage.set('Error al buscar viajes. Intente de nuevo.');
            this.isSearching.set(false);
          }
        });
      },
      error: () => {
        this.errorMessage.set('Fallo de autorización al registrar el acceso judicial.');
        this.isSearching.set(false);
      }
    });
  }

  /**
   * Carga el expediente completo y telemetría del viaje seleccionado.
   */
  selectTrip(idTrip: number): void {
    const caseId = this.officialCaseId().trim();
    if (!caseId) {
      this.errorMessage.set('Debes proporcionar una carpeta de investigación para ver el expediente de un viaje.');
      return;
    }

    this.selectedTripId.set(idTrip);
    this.isSearching.set(true);
    this.errorMessage.set(null);

    this.repository.getTripForensicDetail(idTrip).subscribe({
      next: (detail) => {
        this.selectedTripDetail.set(detail);
        this.isSearching.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al recuperar la ficha forense del viaje.');
        this.isSearching.set(false);
        this.selectedTripDetail.set(null);
      }
    });
  }

  /**
   * Limpia el estado de seguridad.
   */
  private clearState(): void {
    this.tripsResults.set([]);
    this.selectedTripDetail.set(null);
    this.selectedTripId.set(null);
    this.errorMessage.set(null);
  }
}
