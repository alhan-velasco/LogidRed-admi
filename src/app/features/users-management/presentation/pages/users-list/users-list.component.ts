import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersState } from '../../state/users.state';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { NavbarComponent } from '../../../../../core/layout/navbar/navbar.component';
import { AdminUserDTO, CreateAdminRequestDTO } from '../../../data/models/users.dto';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  providers: [UsersState],
  templateUrl: './users-list.component.html',
})
export class UsersListComponent implements OnInit {
  readonly state = inject(UsersState);
  readonly session = inject(AuthSessionService);

  // Form modal visibility states
  showAddModal = false;
  showEditModal = false;

  // New user form binds
  newUserName = '';
  newUserEmail = '';
  newUserRole = 2;

  // Edit user form binds
  editingUser: AdminUserDTO | null = null;
  editUserName = '';
  editUserEmail = '';
  editUserRole = 2;

  ngOnInit(): void {
    this.state.loadUsers();
  }

  openAddModal(): void {
    this.newUserName = '';
    this.newUserEmail = '';
    this.newUserRole = 2;
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAddUser(): void {
    if (!this.newUserName.trim() || !this.newUserEmail.trim()) {
      return;
    }
    const request: CreateAdminRequestDTO = {
      name: this.newUserName.trim(),
      email: this.newUserEmail.trim(),
      role: Number(this.newUserRole),
    };
    this.state.addUser(request, () => {
      this.closeAddModal();
    });
  }

  openEditModal(user: AdminUserDTO): void {
    this.editingUser = user;
    this.editUserName = user.name;
    this.editUserEmail = user.email;
    this.editUserRole = user.role;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.editingUser = null;
    this.showEditModal = false;
  }

  submitEditUser(): void {
    if (!this.editingUser || !this.editUserName.trim() || !this.editUserEmail.trim()) {
      return;
    }
    const updated: AdminUserDTO = {
      id_admin: this.editingUser.id_admin,
      name: this.editUserName.trim(),
      email: this.editUserEmail.trim(),
      role: Number(this.editUserRole),
    };
    this.state.editUser(updated, () => {
      this.closeEditModal();
    });
  }

  deleteUser(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar a este miembro del personal?')) {
      this.state.removeUser(id);
    }
  }
}
