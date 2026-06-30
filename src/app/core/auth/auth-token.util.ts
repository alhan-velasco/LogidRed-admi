import { HttpHeaders } from '@angular/common/http';

const TOKEN_KEY_PATTERN = /token|jwt|auth|bearer|session|acceso/i;

const TOKEN_HEADERS = [
  'authorization',
  'x-auth-token',
  'x-access-token',
  'token',
] as const;

export function normalizeToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim() || null;
  }

  return trimmed;
}

export function isJwtToken(value: string): boolean {
  return value.startsWith('eyJ') && value.split('.').length === 3;
}

function deepExtractToken(value: unknown, visited: Set<object>): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }

  visited.add(value);

  const record = value as Record<string, unknown>;

  for (const [key, fieldValue] of Object.entries(record)) {
    if (TOKEN_KEY_PATTERN.test(key)) {
      const token = normalizeToken(fieldValue);
      if (token) {
        return token;
      }
    }
  }

  for (const [key, fieldValue] of Object.entries(record)) {
    if (key === 'expires_at' && typeof fieldValue === 'string' && isJwtToken(fieldValue)) {
      return fieldValue;
    }
  }

  for (const fieldValue of Object.values(record)) {
    if (typeof fieldValue === 'string') {
      if (isJwtToken(fieldValue)) {
        return fieldValue;
      }

      const embeddedToken = normalizeToken(fieldValue);
      if (embeddedToken && embeddedToken.length > 20) {
        return embeddedToken;
      }
    }

    if (fieldValue && typeof fieldValue === 'object') {
      const nestedToken = deepExtractToken(fieldValue, visited);
      if (nestedToken) {
        return nestedToken;
      }
    }
  }

  return null;
}

export function extractTokenFromBody(body: unknown): string | null {
  if (typeof body === 'string') {
    const token = normalizeToken(body);
    if (token && (isJwtToken(token) || token.length > 20)) {
      return token;
    }
    return null;
  }

  return deepExtractToken(body, new Set());
}

export function extractTokenFromHeaders(headers: HttpHeaders): string | null {
  for (const headerName of TOKEN_HEADERS) {
    const token = normalizeToken(headers.get(headerName));
    if (token) {
      return token;
    }
  }

  for (const headerName of headers.keys()) {
    const token = normalizeToken(headers.get(headerName));
    if (token && (isJwtToken(token) || token.length > 40)) {
      return token;
    }
  }

  return null;
}

export function extractExpiresAt(body: unknown): number | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const expiresAt = (body as Record<string, unknown>)['expires_at'];
  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
    return expiresAt;
  }

  return null;
}
