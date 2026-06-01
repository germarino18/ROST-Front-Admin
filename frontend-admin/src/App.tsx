/**
 * App.tsx — Componente raíz del Frontend Admin de ROST
 *
 * Solo contiene providers. El router vive en router/AppRouter.tsx.
 * Esto separa responsabilidades: App.tsx se encarga de la infraestructura
 * (contextos, query client) y el router define las rutas.
 */

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
