import { createContext } from 'react';
import type { User, BusinessSummary, LoginRequest } from '../types/auth';

export interface AuthContextType {
  user: User | null;
  business: BusinessSummary | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isBusinessAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
