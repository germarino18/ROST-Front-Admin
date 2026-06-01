/**
 * ProtectedRoute.tsx — Guard de rutas protegidas (layout route)
 *
 * Se usa como element de una ruta padre. Renderiza <Outlet /> si pasa
 * las verificaciones. Esto evita rerenders al navegar entre rutas hijas.
 *
 * Estados:
 *   - isLoading → muestra pantalla de "Cargando..." centrada
 *   - !usuario → redirige a /login del admin (propio formulario de login)
 *   - roles definidos y usuario sin permiso → redirige a /no-autorizado
 *   - todo ok → renderiza <Outlet />
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

interface Props {
  roles?: string[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { usuario, isLoading } = useAuth();

  /** Estado: cargando verificación de sesión */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-on-surface-variant text-lg">Cargando...</p>
      </div>
    );
  }

  /** Estado: no autenticado → redirigir al login del admin */
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  /** Estado: autenticado pero sin roles requeridos */
  if (roles) {
    const userRoles = usuario.roles?.map((ur) => ur.rol_codigo) ?? [];
    const hasAccess = roles.some((r) => userRoles.includes(r));
    if (!hasAccess) {
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  /** Estado: autenticado y autorizado → renderizar rutas hijas */
  return <Outlet />;
}
