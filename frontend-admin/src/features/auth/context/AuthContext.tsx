/**
 * AuthContext.tsx — Contexto de autenticación del panel admin
 *
 * Provee estado global de sesión a toda la app.
 * Al montar, hace GET /auth/me para restaurar la sesión vía cookie HttpOnly.
 * Expone: login, logout, hasRole, usuario, isLoading.
 *
 * El usuario tiene un solo rol (rol.codigo).
 * El método hasRole() verifica si el usuario tiene un código de rol específico.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../../../api/client';

interface RolRead {
  codigo: string;
  descripcion: string;
}

export interface UsuarioAuth {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  rol: { codigo: string; descripcion: string } | null;
}

export interface AuthContextType {
  usuario: UsuarioAuth | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (rol: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider — Proveedor del contexto de autenticación
 *
 * Al montarse, intenta restaurar la sesión vía GET /auth/me.
 * Mientras isLoading es true, los componentes hijos deben mostrar un loader.
 * Si no hay sesión (catch), usuario queda null.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<UsuarioAuth>('/auth/me')
      .then((res) => setUsuario(res.data))
      .catch(() => setUsuario(null))
      .finally(() => setIsLoading(false));
  }, []);

  /** POST /auth/login — Inicia sesión con email y contraseña, luego restaura usuario */
  const login = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    const { data } = await api.get<UsuarioAuth>('/auth/me');
    setUsuario(data);
  };

  /** POST /auth/logout — Cierra sesión y limpia el estado del usuario */
  const logout = async () => {
    await api.post('/auth/logout');
    setUsuario(null);
  };

  /** Verifica si el usuario logueado tiene un rol específico (por código) */
  const hasRole = (rol: string) =>
    usuario?.rol?.codigo === rol ?? false;

  return (
    <AuthContext.Provider value={{ usuario, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — Hook para acceder al contexto de autenticación
 *
 * @throws Error si se usa fuera de <AuthProvider>
 * @returns {AuthContextType} {usuario, isLoading, login, logout, hasRole}
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
