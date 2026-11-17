import { apiClient } from './client';
import type {
  LoginRequest,
  RefreshTokenRequest,
  TokenResponse,
  UserProfileResponse,
} from '../types/auth';
import type { StandardResponse } from '../types/api';

export const authApi = {
  async login(credentials: LoginRequest): Promise<StandardResponse<TokenResponse>> {
    const response = await apiClient.post<StandardResponse<TokenResponse>>(
      '/api/v1/auth/login',
      credentials
    );
    return response.data;
  },

  async refreshToken(payload: RefreshTokenRequest): Promise<StandardResponse<TokenResponse>> {
    const response = await apiClient.post<StandardResponse<TokenResponse>>(
      '/api/v1/auth/refresh',
      payload
    );
    return response.data;
  },

  async getMe(): Promise<StandardResponse<UserProfileResponse>> {
    const response = await apiClient.get<StandardResponse<UserProfileResponse>>(
      '/api/v1/auth/me'
    );
    return response.data;
  },
};
