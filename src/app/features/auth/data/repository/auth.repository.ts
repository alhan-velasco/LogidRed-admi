import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { LoginRequestDTO, LoginResponseDTO } from '../models/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://databaselogired.online/auth/login';

  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO | null> {
    return this.http.post<LoginResponseDTO>(this.apiUrl, credentials).pipe(
      catchError(() => of(null))
    );
  }
}
