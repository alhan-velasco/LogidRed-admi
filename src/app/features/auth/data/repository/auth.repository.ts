import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL, API_WITH_CREDENTIALS } from '../../../../core/config/api.config';
import {
  LoginRequestDTO,
  LoginResponseDTO,
  LoginResult,
} from '../models/auth.dto';
import {
  extractExpiresAt,
  extractTokenFromBody,
  extractTokenFromHeaders,
} from '../../../../core/auth/auth-token.util';

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/auth/login`;

  login(credentials: LoginRequestDTO): Observable<LoginResult> {
    return this.http
      .post<LoginResponseDTO>(this.apiUrl, credentials, {
        observe: 'response',
        withCredentials: API_WITH_CREDENTIALS,
      })
      .pipe(
        map((response: HttpResponse<LoginResponseDTO>) => {
          const body = response.body;
          if (body == null) {
            return { status: 'network_error' as const };
          }

          const token =
            extractTokenFromBody(body) ?? extractTokenFromHeaders(response.headers);
          const expiresAt = extractExpiresAt(body);

          if (token) {
            return {
              status: 'success' as const,
              session: { token, expires_at: expiresAt },
            };
          }

          if (expiresAt != null) {
            return {
              status: 'success' as const,
              session: { token: null, expires_at: expiresAt },
            };
          }

          return { status: 'missing_token' as const };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 400) {
            return of({ status: 'invalid_credentials' as const });
          }

          return of({ status: 'network_error' as const });
        })
      );
  }
}
