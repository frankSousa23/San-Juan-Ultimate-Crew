/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * CONTEXTO DE AUTENTICACIÓN Y SESIÓN (apps/web/src/contexts/AuthContext.tsx)
 * ============================================================================
 * 
 * Este módulo gestiona el estado global de autenticación, la persistencia del token
 * JWT, la validación de roles de usuario (RBAC) y el ciclo de vida de la sesión.
 * 
 * FUNCIONALIDADES CLAVE:
 * 1. Verificación Inicial de Sesión (on mount):
 *    - Recupera el token guardado en `localStorage` y llama a `/api/auth/me` para
 *      reconstruir el perfil del usuario, roles y permisos activos.
 * 2. Inicio de Sesión Estándar y Modo Invitado (1-Clic):
 *    - Guarda el token JWT, actualiza el estado reactivo `user` y muestra notificaciones toast.
 * 3. Matriz de Permisos y Roles (RBAC):
 *    - Helper `hasRole(roleName)`: Comprueba si el usuario tiene asignado un rol específico.
 *    - Helper `hasPermission(permissionName)`: Valida permisos granulares, otorgando
 *      acceso universal irrestricto al rol `admin`.
 * 4. Refresco Periódico de Sesión:
 *    - Ejecuta un sondeo suave cada 5 minutos para sincronizar cambios de rol o aprobaciones.
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { authApi, setAuthToken, getAuthToken } from '../lib/api';

// Definición de Interfaces del Sistema de Autenticación
export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  roles?: string[];       // Nombres normalizados de roles (e.g. 'admin', 'captain', 'coach', 'guest')
  permissions?: string[]; // Permisos calculados a partir de los roles
  playerId?: number | null;
  teamId?: number | null;
  teamName?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AuthContextType {
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showSuccessToast, showErrorToast } = useToast();

  // ==========================================================================
  // EFECTO: Verificación de sesión existente al cargar la aplicación
  // ==========================================================================
  useEffect(() => {
    let mounted = true;
    let isCheckingSession = false;
    
    const checkSession = async (silent = false) => {
      // Prevenir verificaciones simultáneas redundantes
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
              // Token inválido o sin datos de usuario: limpiar credenciales locales
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
        // Manejo seguro cuando la sesión expira o es inválida
        if (mounted) {
          setUser(null);
          if (error?.response?.status === 401) {
            setAuthToken(); // Limpiar token revocado
          }
          if (!silent && error?.response?.status !== 401 && error?.response?.status !== 404) {
            console.error('[Auth] Error al verificar sesión:', error);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        isCheckingSession = false;
      }
    };

    // Verificación inicial silenciosa
    checkSession(true);
    
    // Sondeo de sincronización cada 5 minutos
    const interval = setInterval(() => {
      const token = getAuthToken();
      if (token) {
        checkSession(false);
      }
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================================================
  // ACCIÓN: Inicio de Sesión
  // ==========================================================================
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser } = await authApi.login(email, password);
      setAuthToken(token);
      setUser(loggedInUser as User);
      showSuccessToast(`Bienvenido, ${loggedInUser.name || loggedInUser.email}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al iniciar sesión';
      if (error?.response?.status !== 401) {
        showErrorToast(message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // ACCIÓN: Refrescar Perfil del Usuario
  // ==========================================================================
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

  // ==========================================================================
  // ACCIÓN: Cierre de Sesión
  // ==========================================================================
  const logout = async () => {
    try {
      await authApi.logout();
      setAuthToken();
      setUser(null);
      showSuccessToast('Sesión cerrada correctamente');
    } catch (error) {
      console.error('[Auth] Error durante logout:', error);
      setAuthToken();
      setUser(null);
    }
  };

  // ==========================================================================
  // HELPERS RBAC: Comprobación de Roles y Permisos
  // ==========================================================================
  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(roleName);
  };

  const hasPermission = (permissionName: string): boolean => {
    // El rol 'admin' dispone de autorización universal
    if (hasRole('admin')) return true;
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionName);
    }
    return false;
  };

  const value: AuthContextType = {
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

/**
 * Hook personalizado para acceder al estado y métodos de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
