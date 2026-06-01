/**
 * LoginPage.tsx — Página de inicio de sesión del panel admin.
 * - Formulario con email + contraseña
 * - Llama a AuthContext.login() que hace POST /auth/login + GET /auth/me
 * - Muestra error si las credenciales son incorrectas
 * - Redirige al dashboard /admin al iniciar sesión correctamente
 *
 * Estados:
 * - Normal: formulario listo para completar
 * - Error: alerta con mensaje "Email o contraseña incorrectos"
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFEDDB]">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_10px_20px_-5px_rgba(77,96,128,0.08)] p-10 border border-outline-variant/10 w-full max-w-[440px]">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ROST" className="h-14 mx-auto mb-6" />
          <h2 className="font-headline text-2xl font-bold text-primary">Inicio de Sesión</h2>
          <p className="font-body text-on-surface-variant text-sm mt-1">Panel de Administración ROST</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Email */}
          <div>
            <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-[0.08em] mb-1.5">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-4 py-3 text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="admin@store.com"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-[0.08em] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-4 py-3 text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Estado ERROR: credenciales inválidas */}
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-body">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-container text-on-primary py-4 rounded-lg font-body font-semibold uppercase tracking-[0.1em] text-sm hover:opacity-90 transition-all"
          >
            Ingresar
          </button>
        </form>

        {/* Separador decorativo */}
        <div className="flex items-center gap-3 mt-8">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.15em]">Admin ROST</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Link a la tienda */}
        <p className="text-center font-body text-sm text-on-surface-variant mt-6">
          ¿Volver a la{' '}
          <a
            href="http://localhost:5174"
            className="text-primary font-semibold hover:underline"
          >
            Tienda ROST
          </a>
          ?
        </p>
      </div>
    </div>
  );
}
