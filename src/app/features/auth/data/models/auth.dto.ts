export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  expires_at: number;
  token?: string;
  access_token?: string;
  jwt?: string;
  [key: string]: unknown;
}

export interface LoginSessionDTO {
  token: string | null;
  expires_at: number | null;
}

export type LoginResult =
  | { status: 'success'; session: LoginSessionDTO }
  | { status: 'invalid_credentials' }
  | { status: 'missing_token' }
  | { status: 'network_error' };
