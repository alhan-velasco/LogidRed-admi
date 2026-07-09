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
    if (!token) return 1; // Default to worker (1) if no token
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
        const payload = JSON.parse(jsonPayload);
        // Extract role from JWT payload; default to 1 if not present
        return payload.role !== undefined ? Number(payload.role) : 1;
      }
    } catch (e) {
      console.error('Error decoding JWT token role:', e);
    }
    return 1; // Default to worker/employee
  }

  isAdmin(): boolean {
    return this.getRole() === 0;
  }
}
