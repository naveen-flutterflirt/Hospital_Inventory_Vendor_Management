"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch: string;
  avatarInitials: string;
  badge: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendConnected: boolean;
  login: (email: string, pass: string, branch?: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function initializeAuth() {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (storedToken) {
        setToken(storedToken);
        // Verify token with backend /api/v1/auth/me
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            const liveUser: UserProfile = {
              id: String(res.data.id),
              name: res.data.name,
              email: res.data.email,
              role: res.data.role,
              department: res.data.department,
              branch: res.data.branch,
              avatarInitials: res.data.avatar_initials || 'MD',
              badge: res.data.badge || 'Staff',
            };
            setUser(liveUser);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(liveUser));
            setIsBackendConnected(true);
            setIsLoading(false);
            return;
          } else if (res.message?.includes('offline') || res.message?.includes('unreachable') || res.message?.includes('Failed to fetch')) {
            // Backend is temporarily offline or restarting: keep token and use cached user
            setIsBackendConnected(false);
            const storedUser = localStorage.getItem(AUTH_USER_KEY);
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch {
                setUser(null);
              }
            }
          } else {
            // Token is genuinely invalid or rejected by backend (401/403)
            api.removeToken();
            setToken(null);
            setUser(null);
          }
        } catch {
          setIsBackendConnected(false);
          const storedUser = localStorage.getItem(AUTH_USER_KEY);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } else {
        // No stored token: strictly unauthenticated
        setUser(null);
      }

      setIsLoading(false);
    }

    initializeAuth();
  }, []);

  const login = async (
    email: string, 
    pass: string, 
    branch?: string, 
    remember?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Authenticate against production backend API
      const res = await api.login({
        email: email.trim().toLowerCase(),
        password: pass,
        branch,
        rememberMe: remember,
      });

      if (res.success && res.data) {
        const { token: jwtToken, user: apiUser } = res.data;
        
        const profile: UserProfile = {
          id: String(apiUser.id),
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          department: apiUser.department,
          branch: apiUser.branch || branch || 'Central Warehouse & Main Drug Store',
          avatarInitials: apiUser.avatar_initials || 'MD',
          badge: apiUser.badge || 'Staff',
        };

        setToken(jwtToken);
        setUser(profile);
        setIsBackendConnected(true);

        api.setToken(jwtToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return {
        success: false,
        error: res.message || 'Invalid email or password.',
      };
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('[Logout]: Failed to notify server of logout', err);
    } finally {
      api.removeToken();
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isBackendConnected,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
