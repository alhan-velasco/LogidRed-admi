import { Injectable, inject, signal } from '@angular/core';
import { UsersRepository } from '../../data/repository/users.repository';
import { AdminUserDTO, CreateAdminRequestDTO } from '../../data/models/users.dto';

@Injectable()
export class UsersState {
  private readonly repository = inject(UsersRepository);

  readonly users = signal<AdminUserDTO[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.repository.getUsers().subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.error.set('No se pudo cargar la lista de personal. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  addUser(user: CreateAdminRequestDTO, callback?: () => void): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.repository.createUser(user).subscribe({
      next: () => {
        this.loadUsers();
        if (callback) callback();
      },
      error: (err) => {
        console.error('Error adding user', err);
        this.error.set('No se pudo agregar el usuario. Verifica los datos.');
        this.isLoading.set(false);
      },
    });
  }

  editUser(user: AdminUserDTO, callback?: () => void): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.repository.updateUser(user.id_admin, user).subscribe({
      next: () => {
        this.loadUsers();
        if (callback) callback();
      },
      error: (err) => {
        console.error('Error updating user', err);
        this.error.set('No se pudo actualizar el usuario. Verifica los datos.');
        this.isLoading.set(false);
      },
    });
  }

  removeUser(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.repository.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user', err);
        this.error.set('No se pudo eliminar el usuario de la plataforma.');
        this.isLoading.set(false);
      },
    });
  }
}
