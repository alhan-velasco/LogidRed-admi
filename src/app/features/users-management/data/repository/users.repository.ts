import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_WITH_CREDENTIALS } from '../../../../core/config/api.config';
import { AdminUserDTO, CreateAdminRequestDTO } from '../models/users.dto';

@Injectable({ providedIn: 'root' })
export class UsersRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/users`;

  getUsers(): Observable<AdminUserDTO[]> {
    return this.http.get<AdminUserDTO[]>(this.baseUrl, {
      withCredentials: API_WITH_CREDENTIALS,
    });
  }

  createUser(user: CreateAdminRequestDTO): Observable<any> {
    return this.http.post<any>(this.baseUrl, user, {
      withCredentials: API_WITH_CREDENTIALS,
    });
  }

  updateUser(id: number, user: AdminUserDTO): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, user, {
      withCredentials: API_WITH_CREDENTIALS,
    });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, {
      withCredentials: API_WITH_CREDENTIALS,
    });
  }
}
