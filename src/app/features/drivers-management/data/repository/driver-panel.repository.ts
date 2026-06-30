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
}
