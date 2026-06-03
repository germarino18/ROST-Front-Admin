
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage';
import ProductosPage from '../features/productos/pages/ProductosPage';
import ProductoDetallePage from '../features/productos/pages/ProductoDetallePage';
import IngredientesPage from '../features/ingredientes/pages/IngredientesPage';
import CategoriasPage from '../features/categorias/pages/CategoriasPage';
import PedidosKanbanPage from '../features/pedidos/pages/PedidosKanbanPage';
import UsuariosPage from '../features/usuarios/pages/UsuariosPage';
import DashboardPage from '../features/estadisticas/pages/DashboardPage';
import AdminIndexRedirect from './AdminIndexRedirect';

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />

      {/* Ruta protegida principal — /admin es el path base para todas las sub-rutas */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminIndexRedirect />} />

          {/* ADMIN y STOCK */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'STOCK']} />}>
            <Route path="productos" element={<ProductosPage />} />
            <Route path="productos/:id" element={<ProductoDetallePage />} />
          </Route>

          {/* Solo ADMIN */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="ingredientes" element={<IngredientesPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>

          {/* ADMIN, PEDIDOS, COCINERO y CAJERO */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'PEDIDOS', 'COCINERO', 'CAJERO']} />}>
            <Route
              path="pedidos"
              element={
                <ErrorBoundary>
                  <PedidosKanbanPage />
                </ErrorBoundary>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
