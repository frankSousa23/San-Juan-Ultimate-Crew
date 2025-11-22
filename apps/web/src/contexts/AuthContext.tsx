import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { authApi, setAuthToken, getAuthToken } from '../lib/api';

// Define types for AuthContext
interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  name?: string;
  roles?: string[]; // Changed from Role[] to string[] to match authApi.me() response
  playerId?: number | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] =  useState<boolean>(true);
  const { showSuccessToast, showErrorToast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const result = await authApi.me();
          if (result.user) {
            setUser(result.user as User);
          }
        }
      } catch (error) {
        // Not logged in or session expired
        setUser(null);
        setAuthToken(); // Clear invalid token
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser } = await authApi.login(email, password);
      setAuthToken(token);
      setUser(loggedInUser as User);
      showSuccessToast(`Bienvenido, ${loggedInUser.name || loggedInUser.email}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al iniciar sesión';
      showErrorToast(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setAuthToken(); // Clear token
      setUser(null);
      showSuccessToast('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error logging out:', error);
      // Force local logout anyway
      setAuthToken();
      setUser(null);
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    // roles is now always string[]
    return user.roles.includes(roleName);
  };

  const hasPermission = (permissionName: string): boolean => {
    // Since roles are now strings, we can't check permissions
    // For now, admins have all permissions
    return hasRole('admin');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
