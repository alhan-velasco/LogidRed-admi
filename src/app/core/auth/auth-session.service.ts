import { Injectable } from '@angular/core';

const TOKEN_KEY = 'logired_token';
const EXPIRES_AT_KEY = 'logired_expires_at';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getExpiresAt(): number | null {
    const value = localStorage.getItem(EXPIRES_AT_KEY);
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  setSession(token: string | null, expiresAt: number | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (expiresAt != null) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    }
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token) {
      return true;
    }

    const expiresAt = this.getExpiresAt();
    if (expiresAt == null) {
      return false;
    }

    return expiresAt > Math.floor(Date.now() / 1000);
  }

  getRole(): number {
    const token = this.getToken();
    if (!token) return 2;

    const payload = this.decodePayload();
    if (!payload) return 2;

    // The LogiRed backend uses 'usertype' in the JWT payload
    // usertype: 1 = Administrador, usertype: 2 = Empleado
    const rawRole =
      payload['usertype'] ??
      payload['role'] ??
      payload['roles'] ??
      payload['user_role'] ??
      payload['authority'];

    if (rawRole === undefined || rawRole === null) {
      return 2; // Default to employee if no role field exists
    }

    // Handle boolean isAdmin field
    if (payload['isAdmin'] === true) return 1;
    if (payload['isAdmin'] === false) return 2;

    // Handle string roles
    if (typeof rawRole === 'string') {
      const value = rawRole.toLowerCase().trim();
      if (value === 'admin' || value === 'administrador' || value === 'administrator') return 1;
      if (value === 'employee' || value === 'empleado' || value === 'worker' || value === 'user') return 2;
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return this.mapNumericRole(parsed);
      }
      return 2;
    }

    // Handle boolean roles
    if (typeof rawRole === 'boolean') {
      return rawRole ? 1 : 2;
    }

    // Handle numeric roles (usertype: 1 = Admin, usertype: 2 = Employee)
    const role = Number(rawRole);
    if (Number.isNaN(role)) return 2;

    return this.mapNumericRole(role);
  }

  /**
   * Maps a numeric role value to internal convention:
   * - 0 = Admin (legacy)
   * - 1 = Admin (usertype from backend)
   * - 2 = Employee
   * - Anything else = Employee
   */
  private mapNumericRole(role: number): number {
    if (role === 0 || role === 1) return 1; // Admin
    return 2; // Employee
  }

  isAdmin(): boolean {
    return this.getRole() === 1;
  }

  /**
   * Decode the JWT payload and extract the user's display name.
   * Falls back to 'Usuario' if the token doesn't contain a name field.
   */
  getUserName(): string {
    const payload = this.decodePayload();
    const candidate =
      payload?.['name'] ??
      payload?.['nombre'] ??
      payload?.['full_name'] ??
      payload?.['fullname'] ??
      payload?.['username'] ??
      payload?.['user_name'] ??
      payload?.['preferred_username'] ??
      payload?.['first_name'] ??
      payload?.['given_name'] ??
      payload?.['user']?.['name'] ??
      payload?.['user']?.['full_name'] ??
      payload?.['user']?.['username'] ??
      'Usuario';

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    return 'Usuario';
  }

  /**
   * Decode the JWT payload and extract the user's email.
   */
  getUserEmail(): string {
    const payload = this.decodePayload();
    const candidate = payload?.['email'] ?? payload?.['sub'] ?? payload?.['user']?.['email'] ?? '';

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    return '';
  }

  private decodePayload(): Record<string, any> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      }
    } catch (e) {
      console.error('Error decoding JWT payload:', e);
    }
    return null;
  }
}
