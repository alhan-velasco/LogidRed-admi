import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../auth/auth-session.service';

export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  if (session.isAuthenticated() && session.isAdmin()) {
    return true;
  }

  // Workers are redirected back to the pending drivers validation dashboard
  return router.createUrlTree(['/admin/drivers/pending']);
};
