/**
 * authStore.ts — Store de autenticación con Zustand
 *
 * Reemplaza AuthContext como fuente única de estado de sesión.
 * Usar con selectores por slice para evitar re-renders innecesarios:
 *
 *   const usuario = useAuthStore((s) => s.usuario);
 *   const logout   = useAuthStore((s) => s.logout);
 *
 * Al crearse, isLoading arranca en true. checkSession() se llama
 * desde App.tsx al montar la app.
 */

import { create } from 'zustand';
import api from '../../../api/client';

// ────────────────────────────────────────────── Tipos públicos ──────────────────

export interface UsuarioAuth {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  rol: { codigo: string; descripcion: string } | null;
}

// ────────────────────────────────────────────── State y Store ──────────────────

interface AuthState {
  usuario: UsuarioAuth | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  hasRole: (rol: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  isLoading: true,

  /** POST /auth/login — Inicia sesión y carga el usuario */
  login: async (email, password) => {
    await api.post('/auth/login', { email, password });
    const { data } = await api.get<UsuarioAuth>('/auth/me');
    set({ usuario: data });
  },

  /** POST /auth/logout — Cierra sesión y limpia el estado */
  logout: async () => {
    await api.post('/auth/logout');
    set({ usuario: null });
  },

  /** GET /auth/me — Restaura sesión desde cookie HttpOnly */
  checkSession: async () => {
    try {
      const { data } = await api.get<UsuarioAuth>('/auth/me');
      set({ usuario: data });
    } catch {
      set({ usuario: null });
    } finally {
      set({ isLoading: false });
    }
  },

  /** Verifica si el usuario tiene un rol específico por código */
  hasRole: (rol) => {
    const { usuario } = get();
    return usuario?.rol?.codigo === rol;
  },
}));
