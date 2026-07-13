import { Injectable, inject, signal, computed } from '@angular/core';
import { SecurityRepository } from '../../data/repository/security.repository';
import { DriverPanelRepository } from '../../../drivers-management/data/repository/driver-panel.repository';
import { DriverDetailDTO, PendingDriverDTO } from '../../../drivers-management/data/models/driver-panel.dto';
import { DriverProfileDTO, RideRecord, getRideId } from '../../data/models/security.dto';

@Injectable()
export class SecurityState {
  private readonly repository = inject(SecurityRepository);
  private readonly driverPanelRepository = inject(DriverPanelRepository);

  // ── Listado de conductores aprobados (los únicos relevantes aquí) ────
  readonly approvedDrivers = signal<PendingDriverDTO[]>([]);
  readonly searchQuery = signal<string>('');
  readonly isLoadingList = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly filteredDrivers = computed(() => {
    const list = this.approvedDrivers();
    const term = this.searchQuery().trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (d) =>
        `${d.name} ${d.lastname}`.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        String(d.id_user).includes(term)
    );
  });

  readonly totalCount = computed(() => this.approvedDrivers().length);

  // ── Expediente del conductor seleccionado ────────────────────────────
  readonly selectedDriverId = signal<number | null>(null);
  readonly selectedDriverDetail = signal<DriverDetailDTO | null>(null);
  readonly selectedDriverProfile = signal<DriverProfileDTO | null>(null);
  readonly selectedDriverStatistics = signal<Record<string, unknown> | null>(null);
  readonly isLoadingDetail = signal<boolean>(false);
  readonly isBlocking = signal<boolean>(false);

  // ── Viajes del conductor seleccionado ────────────────────────────────
  readonly driverTrips = signal<RideRecord[]>([]);
  readonly tripsPage = signal<number>(1);
  readonly tripsLimit = signal<number>(10);
  readonly isLoadingTrips = signal<boolean>(false);

  // ── Ruta del viaje seleccionado ──────────────────────────────────────
  readonly selectedTripId = signal<number | null>(null);
  readonly selectedTripTracking = signal<RideRecord[]>([]);
  readonly isLoadingTracking = signal<boolean>(false);

  loadDrivers(): void {
    this.isLoadingList.set(true);
    this.errorMessage.set(null);

    this.driverPanelRepository.getDriversByStatus('accepted').subscribe({
      next: (drivers) => {
        this.approvedDrivers.set(drivers);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la lista de conductores.');
        this.isLoadingList.set(false);
      },
    });
  }

  selectDriver(driverId: number): void {
    this.selectedDriverId.set(driverId);
    this.selectedDriverDetail.set(null);
    this.selectedDriverProfile.set(null);
    this.selectedDriverStatistics.set(null);
    this.tripsPage.set(1);
    this.driverTrips.set([]);
    this.clearTripSelection();
    this.isLoadingDetail.set(true);
    this.errorMessage.set(null);

    this.repository.getDriverIdentity(driverId).subscribe({
      next: (detail) => {
        this.selectedDriverDetail.set(detail);
        this.isLoadingDetail.set(false);
      },
      error: () => this.isLoadingDetail.set(false),
    });

    this.repository.getDriverProfile(driverId).subscribe((profile) => this.selectedDriverProfile.set(profile));
    this.repository.getDriverStatistics(driverId).subscribe((stats) => this.selectedDriverStatistics.set(stats));

    this.loadDriverTrips();
  }

  loadDriverTrips(): void {
    const driverId = this.selectedDriverId();
    if (driverId == null) return;

    this.isLoadingTrips.set(true);
    this.repository.getRidesByDriver(driverId, this.tripsPage(), this.tripsLimit()).subscribe({
      next: (result) => {
        this.driverTrips.set(result.items);
        this.isLoadingTrips.set(false);
      },
      error: () => this.isLoadingTrips.set(false),
    });
  }

  changeTripsPage(delta: number): void {
    const next = this.tripsPage() + delta;
    if (next < 1) return;
    this.tripsPage.set(next);
    this.loadDriverTrips();
  }

  selectTrip(ride: RideRecord): void {
    const rideId = getRideId(ride);
    this.selectedTripId.set(rideId);
    this.selectedTripTracking.set([]);

    if (rideId == null) return;

    this.isLoadingTracking.set(true);
    this.repository.getTripTracking(rideId).subscribe({
      next: (points) => {
        this.selectedTripTracking.set(points);
        this.isLoadingTracking.set(false);
      },
      error: () => this.isLoadingTracking.set(false),
    });
  }

  clearTripSelection(): void {
    this.selectedTripId.set(null);
    this.selectedTripTracking.set([]);
  }

  /**
   * Bloquea al conductor: reutiliza /admin/drivers/{id}/reject (único endpoint real
   * que cambia approved a false). Como esta pantalla sólo muestra aprobados, al
   * bloquear se retira de la lista y se limpia la selección.
   */
  blockDriver(reason: string): void {
    const driverId = this.selectedDriverId();
    if (driverId == null || !reason.trim()) return;

    this.isBlocking.set(true);
    this.driverPanelRepository.rejectDriver(driverId, reason.trim()).subscribe({
      next: (success) => {
        this.isBlocking.set(false);
        if (success) {
          this.approvedDrivers.set(this.approvedDrivers().filter((d) => d.id_user !== driverId));
          this.selectedDriverId.set(null);
          this.selectedDriverDetail.set(null);
          this.selectedDriverProfile.set(null);
          this.selectedDriverStatistics.set(null);
          this.driverTrips.set([]);
          this.clearTripSelection();
        } else {
          this.errorMessage.set('No se pudo bloquear al conductor.');
        }
      },
      error: () => {
        this.isBlocking.set(false);
        this.errorMessage.set('Error de conexión al intentar bloquear.');
      },
    });
  }
}
