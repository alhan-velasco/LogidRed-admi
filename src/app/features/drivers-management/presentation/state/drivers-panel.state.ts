import { Injectable, inject, signal } from '@angular/core';
import { DriverPanelRepository } from '../../data/repository/driver-panel.repository';
import { DriverDetailDTO, PendingDriverDTO } from '../../data/models/driver-panel.dto';

@Injectable()
export class DriversPanelState {
  private readonly repository = inject(DriverPanelRepository);

  readonly pendingDrivers = signal<PendingDriverDTO[]>([]);
  readonly selectedDriver = signal<DriverDetailDTO | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadPendingDrivers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.repository.getPendingDrivers().subscribe((drivers) => {
      this.pendingDrivers.set(drivers);
      this.isLoading.set(false);

      if (drivers.length > 0) {
        this.selectDriver(drivers[0].id_user);
      } else {
        this.selectedDriver.set(null);
      }
    });
  }

  selectDriver(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.repository.getDriverDetail(id).subscribe((driver) => {
      if (!driver) {
        this.error.set('No se pudo cargar el detalle del conductor.');
        this.isLoading.set(false);
        return;
      }

      this.selectedDriver.set(driver);
      this.isLoading.set(false);
    });
  }

  approveSelectedDriver(): void {
    const driver = this.selectedDriver();
    if (!driver) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.repository.approveDriver(driver.id_user).subscribe((success) => {
      this.isLoading.set(false);

      if (!success) {
        this.error.set('No se pudo aprobar el conductor.');
        return;
      }

      this.removeDriverFromList(driver.id_user);
    });
  }

  rejectSelectedDriver(reason: string): void {
    const driver = this.selectedDriver();
    if (!driver) {
      return;
    }

    const rejectionReason = reason.trim();
    if (!rejectionReason) {
      this.error.set('Debes indicar un motivo de rechazo.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.repository
      .rejectDriver(driver.id_user, rejectionReason)
      .subscribe((success) => {
        this.isLoading.set(false);

        if (!success) {
          this.error.set('No se pudo rechazar el conductor.');
          return;
        }

        this.removeDriverFromList(driver.id_user);
      });
  }

  private removeDriverFromList(processedId: number): void {
    const updatedDrivers = this.pendingDrivers().filter(
      (driver) => driver.id_user !== processedId
    );
    this.pendingDrivers.set(updatedDrivers);

    if (updatedDrivers.length > 0) {
      this.selectDriver(updatedDrivers[0].id_user);
      return;
    }

    this.selectedDriver.set(null);
  }
}
