/**
 * pagos.ts — API de pagos MercadoPago
 *
 * GET /pagos/:pedido_id — Obtiene el pago asociado a un pedido.
 */

import api from './client';
import type { PagoRead } from '../types';

/** GET /pagos/:pedido_id — Obtiene el pago de un pedido (o null si no existe) */
export async function getPago(pedido_id: number): Promise<PagoRead | null> {
  try {
    const res = await api.get<PagoRead>(`/pagos/${pedido_id}`);
    return res.data;
  } catch (err: any) {
    // Si es 404 (el pedido no tiene pago) retorna null sin error
    if (err?.response?.status === 404) return null;
    throw err;
  }
}
