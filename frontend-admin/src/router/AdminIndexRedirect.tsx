/**
 * AdminIndexRedirect.tsx — Redirige según rol del usuario al entrar a /admin
 *
 * ADMIN/STOCK → productos
 * PEDIDOS/COCINERO/CAJERO → pedidos (kanban)
 * Sin rol válido → no-autorizado
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function AdminIndexRedirect() {
  const { usuario, isLoading } = useAuth();
  if (isLoading) return null;
  const userRoles = usuario?.roles?.map((ur) => ur.rol_codigo) ?? [];
  if (userRoles.includes('ADMIN') || userRoles.includes('STOCK')) return <Navigate to="productos" replace />;
  if (['PEDIDOS', 'COCINERO', 'CAJERO'].some((r) => userRoles.includes(r))) return <Navigate to="pedidos" replace />;
  return <Navigate to="/no-autorizado" replace />;
}
