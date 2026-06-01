/**
 * main.tsx — Entry point del Frontend Admin de ROST
 *
 * Configura QueryClientProvider de TanStack Query y monta la app React.
 * El QueryClient se crea una sola vez fuera del componente para evitar
 * recreaciones en cada render.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
