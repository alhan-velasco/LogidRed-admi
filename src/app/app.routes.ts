import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/presentation/pages/login/login.component';
import { ValidationComponent } from './features/drivers-management/presentation/pages/validation/validation.component';
import { SecurityPanelComponent } from './features/fleet-security/presentation/pages/security-panel/security-panel.component';
import { UsersListComponent } from './features/users-management/presentation/pages/users-list/users-list.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin/drivers/pending',
    component: ValidationComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/security',
    component: SecurityPanelComponent,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/users',
    component: UsersListComponent,
    canActivate: [authGuard, adminGuard],
  },
];

