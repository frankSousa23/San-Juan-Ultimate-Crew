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
  permissions?: string[]; // Permissions from roles
  playerId?: number | null;
  teamId?: number | null;
  teamName?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] =  useState<boolean>(true);
  const { showSuccessToast, showErrorToast } = useToast();

  // Check for existing session on mount and periodically
  useEffect(() => {
    let mounted = true;
    let isCheckingSession = false;
    
    const checkSession = async (silent = false) => {
      // Prevent multiple simultaneous checks
      if (isCheckingSession) return;
      isCheckingSession = true;
      
      try {
        const token = getAuthToken();
        if (token) {
          const result = await authApi.me();
          if (mounted) {
            if (result.user) {
              setUser(result.user as User);
            } else {
              // No user data returned - clear token
              setAuthToken();
              setUser(null);
            }
          }
        } else {
          if (mounted && !silent) {
            setUser(null);
          }
        }
      } catch (error: any) {
        // Not logged in or session expired
        if (mounted) {
          setUser(null);
          // Only clear token if it's a 401 (invalid/expired token)
          // Don't clear token for 404 (endpoint doesn't exist) or other errors
          if (error?.response?.status === 401) {
            setAuthToken(); // Clear invalid token
          }
          // Only log errors if not silent and not a 401 or 404
          if (!silent && error?.response?.status !== 401 && error?.response?.status !== 404) {
            console.error('Session check failed:', error);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        isCheckingSession = false;
      }
    };

    // Initial check - silent to avoid errors on first load
    checkSession(true);
    
    // Check session periodically (every 5 minutes) to refresh user data
    const interval = setInterval(() => {
      const token = getAuthToken();
      if (token) {
        checkSession(false);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run on mount

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser } = await authApi.login(email, password);
      setAuthToken(token);
      setUser(loggedInUser as User);
      // Only show success toast, don't show errors from session check
      showSuccessToast(`Bienvenido, ${loggedInUser.name || loggedInUser.email}`);
    } catch (error: any) {
      // Don't show error toast here if it's already handled by the login page
      // The login page will handle displaying the error
      const message = error?.response?.data?.error || 'Error al iniciar sesión';
      // Only show error if it's not a 401 (which is handled by interceptor)
      if (error?.response?.status !== 401) {
        showErrorToast(message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh user data (useful after profile updates)
  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const result = await authApi.me();
        if (result.user) {
          setUser(result.user as User);
          return result.user;
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setAuthToken();
        setUser(null);
      }
    }
    return null;
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
    // Admin always has all permissions
    if (hasRole('admin')) return true;
    // Check if user has the specific permission
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionName);
    }
    return false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    refreshUser
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
