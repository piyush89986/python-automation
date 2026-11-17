export type UserRole = 'super_admin' | 'business_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  business_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  plan_tier: string;
  max_bots: number;
  max_messages_per_month: number;
  current_month_messages: number;
  is_active: boolean;
}

export interface UserProfileResponse {
  user: User;
  business: BusinessSummary | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
