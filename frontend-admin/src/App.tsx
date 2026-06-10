/**
 * App.tsx — Componente raíz del Frontend Admin de ROST
 *
 * Solo contiene providers. El router vive en router/AppRouter.tsx.
 * Esto separa responsabilidades: App.tsx se encarga de la infraestructura
 * (contextos, query client) y el router define las rutas.
 *
 * La autenticación se maneja vía Zustand (useAuthStore). checkSession()
 * se llama al montar para restaurar la sesión desde cookie HttpOnly.
 */

import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './features/auth/store/authStore';
import AppRouter from './router/AppRouter';

function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
