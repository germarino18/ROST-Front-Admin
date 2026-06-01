/**
 * unidadesMedida.ts — API de unidades de medida
 *
 * CRUD completo contra /api/v1/unidades-medida.
 * Soporta filtro opcional por tipo (masa, volumen, unidad, etc.).
 */

import api from './client';
import type { UnidadMedida, UnidadMedidaCreate, UnidadMedidaUpdate } from '../types';

interface GetUnidadesParams {
  tipo?: string;
}

/** GET /unidades-medida — Lista unidades de medida, opcionalmente filtradas por tipo */
export async function getUnidadesMedida(params?: GetUnidadesParams): Promise<UnidadMedida[]> {
  const query: Record<string, string> = {};
  if (params?.tipo) query.tipo = params.tipo;
  const res = await api.get<UnidadMedida[]>('/unidades-medida', { params: query });
  return res.data;
}

/** GET /unidades-medida/:id — Obtiene una unidad de medida por ID */
export async function getUnidadMedidaById(id: number): Promise<UnidadMedida> {
  const res = await api.get<UnidadMedida>(`/unidades-medida/${id}`);
  return res.data;
}

/** POST /unidades-medida — Crea una nueva unidad de medida */
export async function createUnidadMedida(data: UnidadMedidaCreate): Promise<UnidadMedida> {
  const res = await api.post<UnidadMedida>('/unidades-medida', data);
  return res.data;
}

/** PATCH /unidades-medida/:id — Actualiza parcialmente una unidad de medida */
export async function updateUnidadMedida(id: number, data: UnidadMedidaUpdate): Promise<UnidadMedida> {
  const res = await api.patch<UnidadMedida>(`/unidades-medida/${id}`, data);
  return res.data;
}

/** DELETE /unidades-medida/:id — Elimina una unidad de medida */
export async function deleteUnidadMedida(id: number): Promise<void> {
  await api.delete(`/unidades-medida/${id}`);
}
