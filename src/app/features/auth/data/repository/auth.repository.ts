import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
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

  private buildRequestOptions() {
    return {
      observe: 'response' as const,
      withCredentials: API_WITH_CREDENTIALS,
    };
  }

  private parseLoginResponse(response: HttpResponse<LoginResponseDTO>): LoginResult {
    const body = response.body;
    if (body == null) {
      return { status: 'network_error' as const };
    }

    const token = extractTokenFromBody(body) ?? extractTokenFromHeaders(response.headers);
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
  }

  private handleLoginError(error: HttpErrorResponse): LoginResult {
    if (error.status === 401 || error.status === 400) {
      return { status: 'invalid_credentials' as const };
    }

    return { status: 'network_error' as const };
  }

  private attemptLogin(payload: Record<string, string>): Observable<LoginResult> {
    return this.http.post<LoginResponseDTO>(this.apiUrl, payload, this.buildRequestOptions()).pipe(
      map((response: HttpResponse<LoginResponseDTO>) => this.parseLoginResponse(response)),
      catchError((error: HttpErrorResponse) => of(this.handleLoginError(error)))
    );
  }

  login(credentials: LoginRequestDTO): Observable<LoginResult> {
    const normalizedEmail = credentials.email.trim();
    const normalizedPassword = credentials.password.trim();

    const payloads: Array<Record<string, string>> = [
      { email: normalizedEmail, password: normalizedPassword },
      { username: normalizedEmail, password: normalizedPassword },
      { user: normalizedEmail, password: normalizedPassword },
    ];

    return this.attemptLogin(payloads[0]).pipe(
      switchMap((result) => {
        if (result.status === 'success' || result.status === 'network_error') {
          return of(result);
        }

        return this.attemptLogin(payloads[1]).pipe(
          switchMap((fallbackResult) => {
            if (fallbackResult.status === 'success' || fallbackResult.status === 'network_error') {
              return of(fallbackResult);
            }

            return this.attemptLogin(payloads[2]);
          })
        );
      })
    );
  }
}
