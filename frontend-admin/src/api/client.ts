/**
 * client.ts — Instancia de Axios compartida para toda la API
 *
 * Configuración:
 *   - baseURL: '/api/v1' — todas las requests apuntan al backend bajo este prefijo
 *   - withCredentials: true — envía cookies HttpOnly (la sesión se maneja por cookie, no JWT en localStorage)
 *
 * Interceptor de respuesta:
 *   - Si el backend responde 401 y NO estamos ya en /login, redirige automáticamente
 *     a /login (sesión expirada o no autenticado).
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
