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

/** PATCH /pedidos/:id/accion — Ejecuta una acción sobre un pedido (basado en roles) */
export async function ejecutarAccion(pedidoId: number, accion: string): Promise<Pedido> {
  const res = await api.patch<Pedido>(`/pedidos/${pedidoId}/accion`, { accion });
  return res.data;
}