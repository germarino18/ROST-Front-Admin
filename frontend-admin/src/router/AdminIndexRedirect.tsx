/**
 * AdminIndexRedirect.tsx — Redirige según rol del usuario al entrar a /admin
 *
 * Si tiene ADMIN o STOCK → redirige a productos
 * Si tiene PEDIDOS → redirige a pedidos
 * Si no tiene ningún rol válido → redirige a /no-autorizado
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function AdminIndexRedirect() {
  const { usuario, isLoading } = useAuth();
  if (isLoading) return null;
  const userRoles = usuario?.roles?.map((ur) => ur.rol_codigo) ?? [];
  if (userRoles.includes('ADMIN') || userRoles.includes('STOCK')) return <Navigate to="productos" replace />;
  if (userRoles.includes('PEDIDOS')) return <Navigate to="pedidos" replace />;
  return <Navigate to="/no-autorizado" replace />;
}
