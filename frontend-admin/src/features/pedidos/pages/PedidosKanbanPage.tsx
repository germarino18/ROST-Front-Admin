/**
 * PedidosKanbanPage.tsx — Tablero Kanban adaptativo por rol
 *
 * 3 columnas: Pendientes, En preparación, Listos.
 * Los botones de cada tarjeta cambian según los roles del usuario logueado.
 * Debajo de las columnas: historial de entregados (ENTREGADO).
 * Auto-refetch cada 15 segundos.
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPedidos, ejecutarAccion } from '../../../api/pedidos';
import { getPago } from '../../../api/pagos';
import { useAuthStore } from '../../auth/store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Pedido, PagoRead } from '../../../types';

/* ─────────────────── Constantes ─────────────────── */

interface ColumnaInfo {
  key: string;
  titulo: string;
  incluye: string[];
  badge: string;
}

const COLUMNAS: ColumnaInfo[] = [
  {
    key: 'pendientes',
    titulo: 'Pendientes',
    incluye: ['PENDIENTE', 'CONFIRMADO'],
    badge: 'bg-[#F59E0B]/10 text-[#B45309]',
  },
  {
    key: 'preparacion',
    titulo: 'En preparación',
    incluye: ['EN_PREP'],
    badge: 'bg-[#8B5CF6]/10 text-[#6D28D9]',
  },
  {
    key: 'listos',
    titulo: 'Listos',
    incluye: ['LISTO'],
    badge: 'bg-[#10B981]/10 text-[#047857]',
  },
];

function tiempoRelativo(iso: string): string {
  const ahora = Date.now();
  const creacion = new Date(iso).getTime();
  const diffMin = Math.floor((ahora - creacion) / 60000);
  if (diffMin < 1) return 'recién';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const horas = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (horas < 24) return `hace ${horas}h ${mins}min`;
  return new Date(iso).toLocaleDateString('es-AR');
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Helper: qué botones mostrar según rol ─── */

function botonesParaRol(estado: string, roles: string[]) {
  const esAdmin = roles.includes('ADMIN');
  const esCajero = roles.includes('CAJERO') || roles.includes('PEDIDOS');
  const esCocinero = roles.includes('COCINERO');

  const puede = (permitidos: string[]) =>
    esAdmin || permitidos.some((r) => roles.includes(r));

  switch (estado) {
    case 'PENDIENTE':
      return {
        accionPrimaria: puede(['CAJERO', 'PEDIDOS']) ? 'CONFIRMAR' : null,
        labelPrimaria: 'Confirmar',
        puedeCancelar: puede(['CAJERO', 'PEDIDOS']),
      };
    case 'CONFIRMADO':
      return {
        accionPrimaria: puede(['COCINERO']) ? 'PREPARAR' : null,
        labelPrimaria: 'Preparar',
        puedeCancelar: false,
      };
    case 'EN_PREP':
      return {
        accionPrimaria: puede(['COCINERO']) ? 'LISTO' : null,
        labelPrimaria: 'Listo',
        puedeCancelar: false,
      };
    case 'LISTO':
      return {
        accionPrimaria: puede(['CAJERO', 'PEDIDOS']) ? 'ENTREGAR' : null,
        labelPrimaria: 'Entregar',
        puedeCancelar: false,
      };
    default:
      return { accionPrimaria: null, labelPrimaria: '', puedeCancelar: false };
  }
}

/* ─────────────────── Sub-componentes ─────────────────── */

function TarjetaPedido({
  pedido,
  onAccion,
  onCancelar,
  isPending,
  roles,
}: {
  pedido: Pedido;
  onAccion: () => void;
  onCancelar: () => void;
  isPending: boolean;
  roles: string[];
}) {
  const esEntregado = pedido.estado_actual === 'ENTREGADO';
  const botones = botonesParaRol(pedido.estado_actual, roles);

  // Query del pago MercadoPago asociado a este pedido
  const { data: pago } = useQuery<PagoRead | null>({
    queryKey: ['pago', pedido.id],
    queryFn: () => getPago(pedido.id),
    enabled: true,
    staleTime: 30_000,
    retry: false,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-outline-variant/15 p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-headline font-bold text-primary text-base">
            Pedido #{pedido.id}
          </h3>
          {pedido.usuario_nombre && (
            <p className="text-[12px] text-on-surface-variant font-medium mt-0.5">
              {pedido.usuario_nombre}
            </p>
          )}
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
            {formatearHora(pedido.created_at)} — {tiempoRelativo(pedido.created_at)}
          </p>
        </div>
        {esEntregado && (
          <span className="material-symbols-outlined text-[#10B981] text-[20px] shrink-0">verified</span>
        )}
      </div>

      <div className="space-y-1">
        {pedido.detalles?.map((det) => (
          <div key={det.id} className="flex items-center gap-2 text-sm text-on-surface">
            <span className="font-semibold text-primary/70 min-w-[2rem] text-right">{det.cantidad}x</span>
            <span className="truncate">{det.nombre_snapshot}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
        <span className="text-xs text-on-surface-variant/60">Total</span>
        <span className="font-headline font-bold text-primary text-base">
          ${Number(pedido.total ?? 0).toFixed(2)}
        </span>
      </div>

      {/* Badge de estado de pago MercadoPago (solo si el pedido tiene pago) */}
      {pago && (
        <div className="flex items-center pt-0.5">
          {pago.mp_status === 'pending' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">
              <span className="text-[10px]">💳</span> Pago pendiente
            </span>
          )}
          {pago.mp_status === 'approved' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
              <span className="text-[10px]">✓</span> Pago aprobado
            </span>
          )}
          {pago.mp_status === 'rejected' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
              <span className="text-[10px]">✗</span> Pago rechazado
            </span>
          )}
          {!['pending', 'approved', 'rejected'].includes(pago.mp_status) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
              {pago.mp_status}
            </span>
          )}
        </div>
      )}

      {!esEntregado && pedido.estado_actual !== 'CANCELADO' && (
        <div className="flex gap-2 pt-1">
          {botones.accionPrimaria && (
            <button
              onClick={onAccion}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8B5CF6]/10 text-[#6D28D9] rounded-lg text-xs font-semibold hover:bg-[#8B5CF6]/20 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[14px]">
                {botones.accionPrimaria === 'CONFIRMAR' && 'check'}
                {botones.accionPrimaria === 'PREPARAR' && 'local_dining'}
                {botones.accionPrimaria === 'LISTO' && 'check_circle'}
                {botones.accionPrimaria === 'ENTREGAR' && 'handshake'}
              </span>
              {botones.labelPrimaria}
            </button>
          )}
          {botones.puedeCancelar && (
            <button
              onClick={onCancelar}
              disabled={isPending}
              className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 active:scale-[0.98]"
              title="Cancelar pedido"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Columna({
  columna,
  pedidos,
  onAccion,
  onCancelar,
  isPending,
  roles,
}: {
  columna: ColumnaInfo;
  pedidos: Pedido[];
  onAccion: (p: Pedido) => void;
  onCancelar: (p: Pedido) => void;
  isPending: boolean;
  roles: string[];
}) {
  return (
    <div className="flex flex-col bg-[#F5E6D3]/40 rounded-2xl min-h-[60vh]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <h3 className="font-headline font-bold text-on-surface text-base">{columna.titulo}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${columna.badge}`}>
            {pedidos.length}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 overflow-y-auto max-h-[65vh]">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-[32px]">inbox</span>
            <p className="text-xs mt-2">Sin pedidos</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              onAccion={() => onAccion(pedido)}
              onCancelar={() => onCancelar(pedido)}
              isPending={isPending}
              roles={roles}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Página principal ─────────────────── */

export default function PedidosKanbanPage() {
  const queryClient = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);
  const roles = usuario?.rol?.codigo ? [usuario.rol.codigo] : [];

  const { isConnected, lastReconnect } = useWebSocket({
    onOrderUpdated: (pedido) => {
      queryClient.setQueryData<Pedido[]>(['pedidos'], (old) => {
        if (!old) return [pedido];
        const idx = old.findIndex((p) => p.id === pedido.id);
        if (idx >= 0) {
          const updated = [...old];
          updated[idx] = pedido;
          return updated;
        }
        return [pedido, ...old];
      });
      // Invalidar caché del pago — el pedido pudo cambiar por pago_confirmado
      queryClient.invalidateQueries({ queryKey: ['pago', pedido.id] });
    },
  });

  useEffect(() => {
    if (lastReconnect) {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    }
  }, [lastReconnect, queryClient]);

  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [searchHistorial, setSearchHistorial] = useState('');
  const [historialDetail, setHistorialDetail] = useState<Pedido | null>(null);

  const { data: pedidos, isLoading, isError } = useQuery<Pedido[]>({
    queryKey: ['pedidos'],
    queryFn: getPedidos,
    refetchInterval: isConnected ? false : 15000,
    retry: 1,
  });

  const [accionError, setAccionError] = useState<string | null>(null);

  const accionMutation = useMutation({
    mutationFn: ({ pedidoId, accion }: { pedidoId: number; accion: string }) =>
      ejecutarAccion(pedidoId, accion),
    onSuccess: (data) => {
      setAccionError(null);
      // Actualizar cache instantáneamente con el pedido modificado
      queryClient.setQueryData<Pedido[]>(['pedidos'], (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === data.id) ? { ...p, ...data } : p);
      });
      // Refetch de fondo para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (err: Error) => {
      const msg = (err as any)?.response?.data?.detail || err.message || 'Error desconocido';
      setAccionError(msg);
      console.error('[accionMutation] Error:', msg);
    },
  });

  function handleAccion(pedido: Pedido) {
    const botones = botonesParaRol(pedido.estado_actual, roles);
    if (botones.accionPrimaria) {
      accionMutation.mutate({ pedidoId: pedido.id, accion: botones.accionPrimaria });
    }
  }

  function handleCancelar(pedido: Pedido) {
    setCancelandoId(pedido.id);
  }

  function confirmarCancelar() {
    if (cancelandoId !== null) {
      accionMutation.mutate({ pedidoId: cancelandoId, accion: 'CANCELAR' });
      setCancelandoId(null);
    }
  }

  // Historial de entregados
  const historial = useMemo(
    () => (pedidos ?? []).filter((p) => p.estado_actual === 'ENTREGADO'),
    [pedidos],
  );

  const historialFiltrado = useMemo(() => {
    if (!searchHistorial) return historial;
    const q = searchHistorial.toLowerCase();
    return historial.filter((p) => {
      const matchId = String(p.id).includes(q);
      const matchCliente = (p.usuario_nombre ?? '').toLowerCase().includes(q);
      const matchItems = p.detalles?.some((d) =>
        d.nombre_snapshot.toLowerCase().includes(q),
      ) ?? false;
      return matchId || matchCliente || matchItems;
    });
  }, [historial, searchHistorial]);

  // Agrupar pedidos por columna (excluyendo ENTREGADO y CANCELADO)
  const pedidosPorColumna = COLUMNAS.map((col) => ({
    columna: col,
    pedidos: (pedidos ?? []).filter(
      (p) => col.incluye.includes(p.estado_actual),
    ),
  }));

  const totalActivos = (pedidos ?? []).filter(
    (p) => !['ENTREGADO', 'CANCELADO'].includes(p.estado_actual),
  ).length;

  if (isLoading) {
    return <p className="text-on-surface-variant py-8">Cargando pedidos...</p>;
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-error font-semibold text-lg">Error al cargar pedidos</p>
        <p className="text-on-surface-variant text-sm mt-1">Verificá que el servidor esté corriendo</p>
        <button onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ── Error banner ── */}
      {accionError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
          <span className="flex-1">{accionError}</span>
          <button onClick={() => setAccionError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-2xl font-bold text-primary">Pedidos</h2>
          <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant">
            {totalActivos} activo{totalActivos !== 1 ? 's' : ''}
          </span>
          {historial.length > 0 && (
            <span className="px-3 py-1 bg-[#10B981]/10 text-[#047857] rounded-full text-xs font-semibold">
              {historial.length} entregado{historial.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            title={isConnected ? 'Tiempo real' : 'Reconectando...'}
          />
          <span className="text-xs text-on-surface-variant/50">
            {isConnected ? 'Tiempo real' : 'Reconectando...'}
          </span>
        </div>
      </div>

      {/* ── Tablero Kanban (3 columnas) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {pedidosPorColumna.map(({ columna, pedidos: pedidosCol }) => (
          <Columna
            key={columna.key}
            columna={columna}
            pedidos={pedidosCol}
            onAccion={handleAccion}
            onCancelar={handleCancelar}
            isPending={accionMutation.isPending}
            roles={roles}
          />
        ))}
      </div>

      {/* ── Historial de entregados (siempre visible) ── */}
      {historial.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <h3 className="font-headline font-bold text-on-surface text-base">
                Historial de entregados
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/10 text-[#047857]">
                {historialFiltrado.length}
              </span>
            </div>
            <div className="relative min-w-[200px] max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={searchHistorial}
                onChange={(e) => setSearchHistorial(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-high rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              {searchHistorial && (
                <button
                  onClick={() => setSearchHistorial('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#4d6080] text-white">
                <tr>
                  <th className="px-6 py-3 font-body font-semibold text-xs uppercase tracking-wider">N°</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs uppercase tracking-wider">Entregado</th>
                </tr>
              </thead>
              {historialFiltrado.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">
                        <span className="material-symbols-outlined text-[32px]">search_off</span>
                        <p className="text-sm font-medium">Sin resultados</p>
                        <p className="text-xs">No se encontraron pedidos que coincidan con tu búsqueda</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-outline-variant/10">
                  {historialFiltrado.map((p) => (
                    <tr key={p.id} onClick={() => setHistorialDetail(p)} className="hover:bg-surface-container-high/50 transition-colors cursor-pointer">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#4d6080] flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                            {p.usuario_nombre?.charAt(0) ?? '?'}
                          </div>
                          <span className="font-body text-sm text-on-surface">{p.usuario_nombre || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-0.5">
                          {p.detalles?.map((d) => (
                            <div key={d.id} className="text-sm text-on-surface-variant">
                              <span className="font-semibold">{d.cantidad}x</span> {d.nombre_snapshot}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-headline font-bold text-primary text-sm">
                        ${Number(p.total ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#10B981] text-[16px]">check_circle</span>
                          <span className="text-xs text-on-surface-variant">
                            {p.updated_at ? new Date(p.updated_at).toLocaleString('es-AR') : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Modal de detalle del pedido entregado ── */}
      {historialDetail !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHistorialDetail(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-surface-container-lowest z-10 flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <h3 className="font-headline font-bold text-primary text-lg">
                  Pedido #{historialDetail.id}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                  ENTREGADO
                </span>
              </div>
              <button onClick={() => setHistorialDetail(null)} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
                <div className="w-10 h-10 rounded-full bg-[#4d6080] flex items-center justify-center text-white text-sm font-bold uppercase shrink-0">
                  {historialDetail.usuario_nombre?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-on-surface">{historialDetail.usuario_nombre || '—'}</p>
                  <p className="text-xs text-on-surface-variant">Cliente</p>
                </div>
              </div>

              {/* Timeline de estados */}
              {historialDetail.historial && historialDetail.historial.length > 0 && (
                <div>
                  <h4 className="font-headline font-bold text-sm text-primary mb-3">Historial de estados</h4>
                  <div className="space-y-2">
                    {historialDetail.historial.map((h, i) => (
                      <div key={h.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 ${i === historialDetail.historial.length - 1 ? 'bg-green-500 border-green-500' : 'bg-surface-container-high border-primary/30'}`} />
                          {i < historialDetail.historial.length - 1 && <div className="w-0.5 h-6 bg-primary/20" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {h.estado_desde && (
                              <>
                                <span className="text-xs font-medium text-on-surface-variant line-through">{h.estado_desde}</span>
                                <span className="text-xs text-on-surface-variant/40">→</span>
                              </>
                            )}
                            <span className={`text-xs font-bold ${i === historialDetail.historial.length - 1 ? 'text-green-600' : 'text-primary'}`}>
                              {h.estado_hacia}
                            </span>
                          </div>
                          {h.fecha && (
                            <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
                              {new Date(h.fecha).toLocaleString('es-AR')}
                              {h.cambiado_por === 0 && ' (sistema)'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos */}
              <div>
                <h4 className="font-headline font-bold text-sm text-primary mb-3">Productos</h4>
                <div className="space-y-2">
                  {historialDetail.detalles?.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-surface-container-high rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-headline font-bold text-sm text-primary min-w-[2rem]">{d.cantidad}x</span>
                        <span className="font-body text-sm text-on-surface">{d.nombre_snapshot}</span>
                      </div>
                      <span className="font-body text-sm font-semibold text-on-surface">
                        ${(Number(d.precio_snapshot ?? 0) * d.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-body text-on-surface">${Number(historialDetail.subtotal ?? 0).toFixed(2)}</span>
                </div>
                {Number(historialDetail.descuento ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Descuento</span>
                    <span className="font-body text-green-600">-${Number(historialDetail.descuento).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Costo de envío</span>
                  <span className="font-body text-on-surface">${Number(historialDetail.costo_envio ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-base pt-2 border-t border-outline-variant/20">
                  <span className="font-headline font-bold text-primary">Total</span>
                  <span className="font-headline font-bold text-primary">${Number(historialDetail.total ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4 text-xs text-on-surface-variant">
                <div>
                  <p className="font-semibold">Creado</p>
                  <p>{historialDetail.created_at ? new Date(historialDetail.created_at).toLocaleString('es-AR') : '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">Entregado</p>
                  <p>{historialDetail.updated_at ? new Date(historialDetail.updated_at).toLocaleString('es-AR') : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación para cancelar ── */}
      {cancelandoId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelandoId(null)} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-headline font-bold text-primary text-lg mb-2">Cancelar pedido</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              ¿Estás seguro de cancelar el pedido #{cancelandoId}? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelandoId(null)}
                className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelar}
                disabled={accionMutation.isPending}
                className="px-4 py-2.5 bg-error text-white rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {accionMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
