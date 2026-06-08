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
  const userRole = usuario?.rol?.codigo;
  if (userRole === 'ADMIN' || userRole === 'STOCK') return <Navigate to="productos" replace />;
  if (userRole === 'PEDIDOS' || userRole === 'COCINERO' || userRole === 'CAJERO') return <Navigate to="pedidos" replace />;
  return <Navigate to="/no-autorizado" replace />;
}
