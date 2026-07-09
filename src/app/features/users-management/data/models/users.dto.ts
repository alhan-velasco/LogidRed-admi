export interface AdminUserDTO {
  id_admin: number;
  name: string;
  email: string;
  role: number;
}

export interface CreateAdminRequestDTO {
  name: string;
  email: string;
  role: number;
}
