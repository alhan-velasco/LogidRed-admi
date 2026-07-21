import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { DriverDetailDTO, PendingDriverDTO } from '../models/driver-panel.dto';

@Injectable({ providedIn: 'root' })
export class DriverPanelRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getPendingDrivers(): Observable<PendingDriverDTO[]> {
    return this.http
      .get<PendingDriverDTO[]>(`${this.baseUrl}/admin/drivers/pending`)
      .pipe(catchError(() => of([])));
  }

  getDriversByStatus(status: 'pending' | 'accepted' | 'rejected' | 'blocked'): Observable<PendingDriverDTO[]> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/drivers/status/${status}`)
      .pipe(
        map((response) => {
          if (!response) return [];
          // Si la respuesta es un array directamente
          if (Array.isArray(response)) return response;
          // Si response.data es un array
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          // Si response.data es un objeto (DriverStatusList), buscamos la propiedad que contenga el array de conductores (ej: drivers)
          if (response.data && typeof response.data === 'object') {
            for (const key of Object.keys(response.data)) {
              if (Array.isArray(response.data[key])) {
                return response.data[key];
              }
            }
          }
          // Fallback final: busca en el objeto raíz cualquier propiedad que sea un array
          for (const key of Object.keys(response)) {
            if (Array.isArray(response[key])) {
              return response[key];
            }
          }
          return [];
        }),
        catchError(() => of([]))
      );
  }

  getDriverDetail(id: number): Observable<DriverDetailDTO | null> {
    return this.http
      .get<DriverDetailDTO>(`${this.baseUrl}/admin/drivers/${id}`)
      .pipe(catchError(() => of(null)));
  }

  approveDriver(id: number): Observable<boolean> {
    return this.http
      .post(`${this.baseUrl}/admin/drivers/${id}/approve`, {})
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  rejectDriver(id: number, reason: string): Observable<boolean> {
    return this.http
      .post(`${this.baseUrl}/admin/drivers/${id}/reject`, {
        rejection_reason: reason,
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  blockDriver(id: number, reason: string): Observable<boolean> {
    return this.http
      .post(`${this.baseUrl}/admin/drivers/${id}/block`, {
        rejection_reason: reason,
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }
}

