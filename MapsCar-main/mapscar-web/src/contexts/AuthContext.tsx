import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, isAdminUser } from '../services/api';

export type UserRole = 'admin' | 'user' | null;

export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any | null;
  isLoading: boolean;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('mapscar_token');
      const storedUser = getCurrentUser();

      if (token && storedUser) {
        setIsAuthenticated(true);
        setUser(storedUser);
        setIsAdmin(isAdminUser());
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mapscar_token');
    localStorage.removeItem('mapscar_user');
    localStorage.removeItem('mapscar_vehicle');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, isLoading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
