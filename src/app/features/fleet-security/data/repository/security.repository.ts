import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { DriverDetailDTO } from '../../../drivers-management/data/models/driver-panel.dto';
import { DriverProfileDTO, PaginatedRidesDTO, RideRecord } from '../models/security.dto';

/** Extrae la lista y, si existe, la metadata de paginación de una respuesta con forma variable. */
function unwrapRides(response: any, page: number, limit: number): PaginatedRidesDTO {
  if (Array.isArray(response)) {
    return { items: response, page, limit };
  }

  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return { items: data, page, limit, total: response?.total ?? response?.meta?.total };
  }

  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return {
          items: data[key],
          page: data.page ?? page,
          limit: data.limit ?? limit,
          total: data.total ?? data.count,
        };
      }
    }
  }

  return { items: [], page, limit };
}

function unwrapData<T>(response: any): T | null {
  if (response == null) return null;
  return (response.data ?? response) as T;
}

@Injectable({ providedIn: 'root' })
export class SecurityRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  /** GET /admin/rides/statistics — conteo y porcentaje de viajes por estado, global. */
  getGlobalStatistics(): Observable<Record<string, unknown> | null> {
    return this.http.get<any>(`${this.baseUrl}/admin/rides/statistics`).pipe(
      map((res) => unwrapData<Record<string, unknown>>(res)),
      catchError(() => of(null))
    );
  }

  /** GET /admin/rides/driver/{id}/statistics — estadísticas de viajes de un conductor. */
  getDriverStatistics(driverId: number): Observable<Record<string, unknown> | null> {
    return this.http.get<any>(`${this.baseUrl}/admin/rides/driver/${driverId}/statistics`).pipe(
      map((res) => unwrapData<Record<string, unknown>>(res)),
      catchError(() => of(null))
    );
  }

  /** GET /admin/rides — todos los viajes, paginado. */
  getRides(page: number, limit: number): Observable<PaginatedRidesDTO> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.baseUrl}/admin/rides`, { params }).pipe(
      map((res) => unwrapRides(res, page, limit)),
      catchError(() => of({ items: [], page, limit }))
    );
  }

  /** GET /admin/rides/driver/{id} — viajes de un conductor específico, paginado. */
  getRidesByDriver(driverId: number, page: number, limit: number): Observable<PaginatedRidesDTO> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.baseUrl}/admin/rides/driver/${driverId}`, { params }).pipe(
      map((res) => unwrapRides(res, page, limit)),
      catchError(() => of({ items: [], page, limit }))
    );
  }

  /** GET /admin/rides/status/{id_status} — viajes filtrados por estatus, paginado. */
  getRidesByStatus(statusId: number, page: number, limit: number): Observable<PaginatedRidesDTO> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.baseUrl}/admin/rides/status/${statusId}`, { params }).pipe(
      map((res) => unwrapRides(res, page, limit)),
      catchError(() => of({ items: [], page, limit }))
    );
  }

  /** GET /admin/rides/driver/{id}/status/{id_status} — viajes de un conductor por estatus, paginado. */
  getRidesByDriverAndStatus(
    driverId: number,
    statusId: number,
    page: number,
    limit: number
  ): Observable<PaginatedRidesDTO> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<any>(`${this.baseUrl}/admin/rides/driver/${driverId}/status/${statusId}`, { params })
      .pipe(
        map((res) => unwrapRides(res, page, limit)),
        catchError(() => of({ items: [], page, limit }))
      );
  }

  /** GET /admin/rides/{id}/tracking — coordenadas GPS registradas durante el viaje. */
  getTripTracking(rideId: number): Observable<RideRecord[]> {
    return this.http.get<any>(`${this.baseUrl}/admin/rides/${rideId}/tracking`).pipe(
      map((res) => {
        const data = unwrapData<any>(res);
        if (Array.isArray(data)) return data;
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /** GET /admin/drivers/{id} — identidad, vehículos y documentos del conductor para el expediente. */
  getDriverIdentity(driverId: number): Observable<DriverDetailDTO | null> {
    return this.http.get<DriverDetailDTO>(`${this.baseUrl}/admin/drivers/${driverId}`).pipe(
      catchError(() => of(null))
    );
  }

  /** GET /admin/drivers/{id}/profile — calificación global y reseñas del conductor. */
  getDriverProfile(driverId: number): Observable<DriverProfileDTO | null> {
    return this.http.get<any>(`${this.baseUrl}/admin/drivers/${driverId}/profile`).pipe(
      map((res) => unwrapData<DriverProfileDTO>(res)),
      catchError(() => of(null))
    );
  }
}
