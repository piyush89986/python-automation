import React, { useEffect, useState, useCallback } from 'react';
import type { User, BusinessSummary, LoginRequest } from '../types/auth';
import { authApi } from '../api/auth';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [business, setBusiness] = useState<BusinessSummary | null>(() => {
    const saved = localStorage.getItem('current_business');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_business');
    setUser(null);
    setBusiness(null);
    setAccessToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.data) {
        setUser(response.data.user);
        setBusiness(response.data.business);
        localStorage.setItem('current_user', JSON.stringify(response.data.user));
        if (response.data.business) {
          localStorage.setItem('current_business', JSON.stringify(response.data.business));
        } else {
          localStorage.removeItem('current_business');
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await refreshProfile();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshProfile]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const data = response.data;

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('current_user', JSON.stringify(data.user));

      setUser(data.user);
      setAccessToken(data.access_token);

      // Now fetch complete profile including tenant business details
      const profileRes = await authApi.getMe();
      if (profileRes.data) {
        setUser(profileRes.data.user);
        setBusiness(profileRes.data.business);
        localStorage.setItem('current_user', JSON.stringify(profileRes.data.user));
        if (profileRes.data.business) {
          localStorage.setItem('current_business', JSON.stringify(profileRes.data.business));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isBusinessAdmin = user?.role === 'business_admin';
  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        accessToken,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isBusinessAdmin,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
