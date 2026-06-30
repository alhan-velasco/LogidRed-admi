export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  expires_at: number;
}
