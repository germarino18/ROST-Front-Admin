/**
 * ingredientes.ts — API de ingredientes
 *
 * CRUD completo contra /api/v1/ingredientes.
 * Soporta filtro por búsqueda (q) y si es alérgeno (es_alergeno).
 */

import api from './client';
import type { Ingrediente, IngredienteCreate, IngredienteUpdate } from '../types';

interface GetIngredientesParams {
  q?: string;
  es_alergeno?: boolean;
}

/** GET /ingredientes — Lista ingredientes con filtros opcionales (búsqueda, alérgeno) */
export async function getIngredientes(params?: GetIngredientesParams): Promise<Ingrediente[]> {
  const query: Record<string, string> = {};
  if (params?.q) query.q = params.q;
  if (params?.es_alergeno !== undefined) query.es_alergeno = String(params.es_alergeno);
  const res = await api.get<Ingrediente[]>('/ingredientes', { params: query });
  return res.data;
}

/** GET /ingredientes/:id — Obtiene un ingrediente por ID */
export async function getIngredienteById(id: number): Promise<Ingrediente> {
  const res = await api.get<Ingrediente>(`/ingredientes/${id}`);
  return res.data;
}

/** POST /ingredientes — Crea un nuevo ingrediente */
export async function createIngrediente(data: IngredienteCreate): Promise<Ingrediente> {
  const res = await api.post<Ingrediente>('/ingredientes', data);
  return res.data;
}

/** PATCH /ingredientes/:id — Actualiza parcialmente un ingrediente */
export async function updateIngrediente(id: number, data: IngredienteUpdate): Promise<Ingrediente> {
  const res = await api.patch<Ingrediente>(`/ingredientes/${id}`, data);
  return res.data;
}

/** DELETE /ingredientes/:id — Elimina un ingrediente */
export async function deleteIngrediente(id: number): Promise<void> {
  await api.delete(`/ingredientes/${id}`);
}
