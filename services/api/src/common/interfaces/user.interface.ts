export enum UserRole {
  CUSTOMER = 'customer',
  CHEF = 'chef',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
