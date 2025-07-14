'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Verify token and get user info
        const response = await api.get('/auth/user/');
        setUser(response.data);
      } else {
        // No token, redirect to login if not already there
        if (window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      // Auth failed, clean up and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      if (window.location.pathname !== '/login') {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/token/', {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Get user info
      const userResponse = await api.get('/auth/user/');
      setUser(userResponse.data);

      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      // Get the refresh token before clearing localStorage
      const refreshToken = localStorage.getItem('refresh_token');
      
      // If we have a refresh token, try to blacklist it on the server
      if (refreshToken) {
        try {
          await api.post('/api/token/blacklist/', {
            refresh: refreshToken
          });
        } catch (error) {
          // If blacklisting fails, continue with logout anyway
          console.warn('Failed to blacklist token on server:', error);
        }
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Always clear local storage and redirect, even if server call fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      
      // Redirect to login page
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
