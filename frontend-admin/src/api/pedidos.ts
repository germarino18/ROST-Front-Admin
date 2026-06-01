/**
 * pedidos.ts — API de pedidos
 *
 * CRUD contra /api/v1/pedidos con tipos.
 */

import api from './client';
import type { Pedido } from '../types';

/** GET /pedidos — Lista todos los pedidos */
export async function getPedidos(): Promise<Pedido[]> {
  const res = await api.get<Pedido[]>('/pedidos');
  return res.data;
}

/** GET /pedidos/:id — Obtiene un pedido por ID */
export async function getPedidoById(id: number): Promise<Pedido> {
  const res = await api.get<Pedido>(`/pedidos/${id}`);
  return res.data;
}

/** PATCH /pedidos/:id/estado — Cambia el estado de un pedido */
export async function avanzarEstado(pedidoId: number, nuevoEstado: string): Promise<Pedido> {
  const res = await api.patch<Pedido>(`/pedidos/${pedidoId}/estado`, { nuevo_estado: nuevoEstado });
  return res.data;
}
