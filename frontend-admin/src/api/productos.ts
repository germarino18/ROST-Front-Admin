/**
 * productos.ts — API de productos
 *
 * CRUD completo contra /api/v1/productos.
 * Cada función recibe params tipados y retorna los tipos correspondientes.
 */

import api from './client';
import type { Producto, ProductoCreate, ProductoUpdate } from '../types';

interface GetProductosParams {
  q?: string;
  categoria_id?: number;
  disponible?: boolean;
}

/** GET /productos — Lista productos con filtros opcionales (búsqueda, categoría, disponibilidad) */
export async function getProductos(params?: GetProductosParams): Promise<Producto[]> {
  const query: Record<string, string> = {};
  if (params?.q) query.q = params.q;
  if (params?.categoria_id) query.categoria_id = String(params.categoria_id);
  if (params?.disponible !== undefined) query.disponible = String(params.disponible);
  const res = await api.get<Producto[]>('/productos', { params: query });
  return res.data;
}

/** GET /productos/:id — Obtiene un producto por su ID con categorías e ingredientes expandidos */
export async function getProductoById(id: number): Promise<Producto> {
  const res = await api.get<Producto>(`/productos/${id}`);
  return res.data;
}

/** POST /productos — Crea un nuevo producto */
export async function createProducto(data: ProductoCreate): Promise<Producto> {
  const res = await api.post<Producto>('/productos', data);
  return res.data;
}

/** PATCH /productos/:id — Actualiza parcialmente un producto */
export async function updateProducto(id: number, data: ProductoUpdate): Promise<Producto> {
  const res = await api.patch<Producto>(`/productos/${id}`, data);
  return res.data;
}

/** DELETE /productos/:id — Elimina un producto */
export async function deleteProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`);
}
