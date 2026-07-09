import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="w-full h-20 bg-[#2B3132] border-b border-white/5 relative overflow-hidden select-none">
      <div class="mx-auto flex max-w-[1440px] h-full items-center justify-between px-6">

        <!-- Logo e Identidad (Izquierda) -->
        <div class="flex items-center gap-3">
          <img src="assets/brand/logired.png" width="40" height="40" class="h-10 w-auto shrink-0" alt="LogiRed" loading="eager" decoding="async" />
          <div class="flex flex-col justify-center">
            <span class="text-[#1D6B4F] text-2xl font-bold font-['Outfit'] leading-none">LogiRed</span>
            <span class="text-[#1D6B4F] text-xs font-bold font-['Outfit'] leading-none mt-1 uppercase tracking-wider">Administrador</span>
          </div>
        </div>

        <!-- Navegación Central -->
        <nav class="flex items-center gap-8">
          <a
            routerLink="/admin/drivers/pending"
            routerLinkActive="bg-[#003C2A]/26 outline outline-1 outline-[#1D6B4F]/30"
            [routerLinkActiveOptions]="{exact: true}"
            class="px-5 py-2 rounded-[3px] text-white text-xl font-bold font-['Outfit'] transition hover:bg-white/5">
            Validación
          </a>
          @if (session.isAdmin()) {
            <a
              routerLink="/admin/security"
              routerLinkActive="bg-[#003C2A]/26 outline outline-1 outline-[#1D6B4F]/30"
              class="px-5 py-2 rounded-[3px] text-white text-xl font-bold font-['Outfit'] transition hover:bg-white/5">
              Seguridad
            </a>
            <a
              routerLink="/admin/users"
              routerLinkActive="bg-[#003C2A]/26 outline outline-1 outline-[#1D6B4F]/30"
              class="px-5 py-2 rounded-[3px] text-white text-xl font-bold font-['Outfit'] transition hover:bg-white/5">
              Usuarios
            </a>
          }
        </nav>

        <!-- Perfil (Derecha) -->
        <div class="flex items-center gap-5">
          <div class="w-px h-10 bg-stone-300/30"></div>

          <div class="relative">
            <button
              type="button"
              (click)="profileDropdownOpen.set(!profileDropdownOpen())"
              class="pl-4 pr-4 py-2 rounded-full outline outline-1 outline-stone-300/40 inline-flex items-center gap-3 bg-[#1B2122]/40 cursor-pointer border-0 transition hover:bg-[#1B2122]/70"
            >
              <div class="size-8 bg-[#1D6B4F] rounded-full flex justify-center items-center shrink-0">
                <span class="text-white text-sm font-bold font-['Outfit'] leading-none">{{ userInitial() }}</span>
              </div>
              <span class="text-white text-base font-normal font-['Outfit'] leading-none">{{ session.getUserName() }}</span>
              <svg class="h-4 w-4 text-gray-400 transition" [class.rotate-180]="profileDropdownOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            @if (profileDropdownOpen()) {
              <div class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#15191c] shadow-2xl shadow-black/50 z-50 overflow-hidden">
                <button
                  type="button"
                  (click)="onUpdatePassword()"
                  class="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition flex items-center gap-3 cursor-pointer bg-transparent border-0 outline-none"
                >
                  <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  Actualizar Contraseña
                </button>
                <div class="border-t border-white/5"></div>
                <button
                  type="button"
                  (click)="onLogout()"
                  class="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition flex items-center gap-3 cursor-pointer bg-transparent border-0 outline-none"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly profileDropdownOpen = signal<boolean>(false);

  readonly userInitial = computed(() => {
    const name = this.session.getUserName();
    return name.charAt(0).toUpperCase();
  });

  onUpdatePassword(): void {
    this.profileDropdownOpen.set(false);
    alert('Funcionalidad de actualización de contraseña próximamente.');
  }

  onLogout(): void {
    this.profileDropdownOpen.set(false);
    this.session.clearSession();
    this.router.navigate(['/login']);
  }
}
