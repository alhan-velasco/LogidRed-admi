import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL, API_WITH_CREDENTIALS } from '../config/api.config';
import { AuthSessionService } from '../auth/auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const token = session.getToken();
  const isApiRequest =
    req.url.startsWith(API_BASE_URL) || req.url.startsWith('/api');
  const isLoginRequest = req.url.includes('/auth/login');

  if (!isApiRequest) {
    return next(req);
  }

  const headers: Record<string, string> = {};
  if (token && !isLoginRequest) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(
    req.clone({
      withCredentials: API_WITH_CREDENTIALS,
      setHeaders: headers,
    })
  );
};
