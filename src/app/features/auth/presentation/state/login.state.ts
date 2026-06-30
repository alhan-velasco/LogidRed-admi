import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRepository } from '../../data/repository/auth.repository';

@Injectable()
export class LoginState {
  private readonly authRepository = inject(AuthRepository);
  private readonly router = inject(Router);

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

    this.authRepository.login({ email, password }).subscribe((response) => {
      if (response?.expires_at != null) {
        localStorage.setItem('logired_expires_at', String(response.expires_at));
        this.router.navigate(['/admin/drivers/pending']);
        return;
      }

      this.isLoading.set(false);
      this.errorMessage.set(
        'Credenciales incorrectas. Verifica tu email y contraseña.'
      );
    });
  }
}
