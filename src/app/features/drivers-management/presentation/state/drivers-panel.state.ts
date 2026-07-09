import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DriverPanelRepository } from '../../data/repository/driver-panel.repository';
import { DriverDetailDTO, PendingDriverDTO } from '../../data/models/driver-panel.dto';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

export type DriverWithStatus = PendingDriverDTO & { status: 'pending' | 'approved' | 'rejected' };

@Injectable()
export class DriversPanelState {
  private readonly repository = inject(DriverPanelRepository);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  // Estado con Signals
  readonly allDrivers = signal<DriverWithStatus[]>([]);
  readonly activeFilter = signal<'all' | 'approved' | 'pending' | 'rejected'>('all');
  readonly selectedDriver = signal<DriverDetailDTO | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Listado filtrado calculado reactivamente
  readonly filteredDrivers = computed(() => {
    const list = this.allDrivers();
    const filter = this.activeFilter();
    
    if (filter === 'all') {
      return list;
    }
    return list.filter((driver) => driver.status === filter);
  });

  readonly pendingDrivers = computed(() =>
    this.allDrivers().filter((driver) => driver.status === 'pending')
  );

  // Totales calculados reactivamente
  readonly totalCount = computed(() => this.allDrivers().length);
  
  readonly approvedCount = computed(() => 
    this.allDrivers().filter((driver) => driver.status === 'approved' || driver.approved === true).length
  );
  
  readonly pendingCount = computed(() => 
    this.allDrivers().filter((driver) => driver.status === 'pending').length
  );
  
  readonly rejectedCount = computed(() => 
    this.allDrivers().filter((driver) => driver.status === 'rejected').length
  );

  loadPendingDrivers(): void {
    if (!this.session.isAuthenticated()) {
      this.error.set('Sesión no válida. Inicia sesión nuevamente.');
      void this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Consumir en paralelo todos los estados reales desde la API de LogiRed
    forkJoin({
      pending: this.repository.getDriversByStatus('pending'),
      accepted: this.repository.getDriversByStatus('accepted'),
      rejected: this.repository.getDriversByStatus('rejected')
    }).subscribe({
      next: ({ pending, accepted, rejected }) => {
        const mappedPending = pending.map((d) => ({
          ...d,
          status: 'pending' as const,
          approved: false
        }));
        const mappedAccepted = accepted.map((d) => ({
          ...d,
          status: 'approved' as const,
          approved: true
        }));
        const mappedRejected = rejected.map((d) => ({
          ...d,
          status: 'rejected' as const,
          approved: false
        }));

        this.allDrivers.set([...mappedPending, ...mappedAccepted, ...mappedRejected]);
        this.isLoading.set(false);

        const filtered = this.filteredDrivers();
        if (filtered.length > 0) {
          this.selectDriver(filtered[0].id_user);
        } else {
          this.selectedDriver.set(null);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de conductores desde la API.');
        this.isLoading.set(false);
      }
    });
  }

  selectDriver(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.repository.getDriverDetail(id).subscribe({
      next: (driver) => {
        if (!driver) {
          this.error.set('No se pudo cargar el detalle del conductor.');
          this.isLoading.set(false);
          return;
        }

        this.selectedDriver.set(driver);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Error de conexión al cargar el detalle del conductor.');
        this.isLoading.set(false);
      }
    });
  }

  approveSelectedDriver(): void {
    const driver = this.selectedDriver();
    if (!driver) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.repository.approveDriver(driver.id_user).subscribe({
      next: (success) => {
        this.isLoading.set(false);

        if (!success) {
          this.error.set('No se pudo aprobar el conductor.');
          return;
        }

        this.updateDriverStatusLocal(driver.id_user, 'approved');
      },
      error: () => {
        this.error.set('Error de conexión al intentar aprobar.');
        this.isLoading.set(false);
      }
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

    this.repository.rejectDriver(driver.id_user, rejectionReason).subscribe({
      next: (success) => {
        this.isLoading.set(false);

        if (!success) {
          this.error.set('No se pudo rechazar el conductor.');
          return;
        }

        this.updateDriverStatusLocal(driver.id_user, 'rejected');
      },
      error: () => {
        this.error.set('Error de conexión al intentar rechazar.');
        this.isLoading.set(false);
      }
    });
  }

  private updateDriverStatusLocal(id: number, status: 'approved' | 'rejected'): void {
    // Actualizamos la lista local manteniendo el registro en memoria
    const updated = this.allDrivers().map((d) => {
      if (d.id_user === id) {
        return {
          ...d,
          approved: status === 'approved',
          status: status
        };
      }
      return d;
    });
    
    this.allDrivers.set(updated);

    // Actualizamos también el conductor seleccionado actualmente
    const selected = this.selectedDriver();
    if (selected && selected.id_user === id) {
      this.selectedDriver.set({
        ...selected,
        approved: status === 'approved'
      });
    }

    // Auto-seleccionamos el siguiente disponible bajo el filtro activo
    const filtered = this.filteredDrivers();
    if (filtered.length > 0) {
      const alreadySelectedFiltered = filtered.find((d) => d.id_user === id);
      if (alreadySelectedFiltered) {
        // Si sigue en el filtro activo (ej. filtro 'all'), mantenemos la selección
        this.selectDriver(id);
      } else {
        // Si ya no entra en el filtro activo, seleccionamos el primero del nuevo listado
        this.selectDriver(filtered[0].id_user);
      }
    } else {
      this.selectedDriver.set(null);
    }
  }
}
