import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from '../../data/repository/auth.repository';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Injectable()
export class LoginState {
  private readonly authRepository = inject(AuthRepository);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  onSubmit(): void {
    const email = this.email().trim();
    const password = this.password().trim();

    if (!email || !password) {
      this.errorMessage.set('Por favor, completa todos los campos.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authRepository.login({ email, password }).subscribe((result) => {
      this.isLoading.set(false);

      if (result.status === 'success') {
        this.session.setSession(result.session.token, result.session.expires_at);
        this.isLoading.set(false);
        this.router.navigate(['/admin/drivers/pending']);
        return;
      }

      if (result.status === 'missing_token') {
        this.errorMessage.set(
          'La API respondió sin token ni expiración de sesión. Revisa el endpoint /auth/login.'
        );
        return;
      }

      if (result.status === 'invalid_credentials') {
        this.errorMessage.set('Credenciales incorrectas. Verifica tu email y contraseña.');
        return;
      }

      this.errorMessage.set('No se pudo conectar con el servidor. Intenta nuevamente.');
    });
  }
}
