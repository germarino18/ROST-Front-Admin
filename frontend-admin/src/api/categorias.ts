/**
 * categorias.ts — API de categorías
 *
 * CRUD completo contra /api/v1/categorias.
 * Soporta filtro por búsqueda (q) y categoría padre (parent_id).
 */

import api from './client';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types';

interface GetCategoriasParams {
  q?: string;
  parent_id?: number | null;
}

/** GET /categorias — Lista categorías con filtros opcionales (búsqueda, padre) */
export async function getCategorias(params?: GetCategoriasParams): Promise<Categoria[]> {
  const query: Record<string, string> = {};
  if (params?.q) query.q = params.q;
  if (params?.parent_id !== undefined && params?.parent_id !== null) query.parent_id = String(params.parent_id);
  const res = await api.get<Categoria[]>('/categorias', { params: query });
  return res.data;
}

/** GET /categorias/:id — Obtiene una categoría por ID */
export async function getCategoriaById(id: number): Promise<Categoria> {
  const res = await api.get<Categoria>(`/categorias/${id}`);
  return res.data;
}

/** POST /categorias — Crea una nueva categoría */
export async function createCategoria(data: CategoriaCreate): Promise<Categoria> {
  const res = await api.post<Categoria>('/categorias', data);
  return res.data;
}

/** PATCH /categorias/:id — Actualiza parcialmente una categoría */
export async function updateCategoria(id: number, data: CategoriaUpdate): Promise<Categoria> {
  const res = await api.patch<Categoria>(`/categorias/${id}`, data);
  return res.data;
}

/** DELETE /categorias/:id — Elimina una categoría */
export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`);
}
