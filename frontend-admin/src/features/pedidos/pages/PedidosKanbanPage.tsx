/**
 * PedidosKanbanPage.tsx — Tablero Kanban de pedidos (estilo Trello)
 *
 * 3 columnas fijas: Pendientes, En preparación, Entregados.
 * La columna Entregados tiene un botón "Limpiar" que oculta las tarjetas
 * y las muestra en una tabla inferior con búsqueda por cliente.
 * Auto-refetch cada 15 segundos.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPedidos, avanzarEstado } from '../../../api/pedidos';
import type { Pedido } from '../../../types';

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
    incluye: ['EN_PREP', 'EN_CAMINO'],
    badge: 'bg-[#8B5CF6]/10 text-[#6D28D9]',
  },
  {
    key: 'entregados',
    titulo: 'Entregados',
    incluye: ['ENTREGADO'],
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

/* ─────────────────── Sub-componentes ─────────────────── */

function TarjetaPedido({
  pedido,
  onAvanzar,
  onCancelar,
  isPending,
}: {
  pedido: Pedido;
  onAvanzar: () => void;
  onCancelar: () => void;
  isPending: boolean;
}) {
  const mostrarPreparar = ['PENDIENTE', 'CONFIRMADO'].includes(pedido.estado_actual);
  const mostrarEntregar = ['EN_PREP', 'EN_CAMINO'].includes(pedido.estado_actual);
  const mostrarCancelar = ['PENDIENTE', 'CONFIRMADO'].includes(pedido.estado_actual);
  const esTerminal = pedido.estado_actual === 'ENTREGADO';

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
        {esTerminal && (
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

      {!esTerminal && (
        <div className="flex gap-2 pt-1">
          {mostrarPreparar && (
            <button
              onClick={onAvanzar}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8B5CF6]/10 text-[#6D28D9] rounded-lg text-xs font-semibold hover:bg-[#8B5CF6]/20 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[14px]">local_dining</span>
              Preparar
            </button>
          )}
          {mostrarEntregar && (
            <button
              onClick={onAvanzar}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#10B981]/10 text-[#047857] rounded-lg text-xs font-semibold hover:bg-[#10B981]/20 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Entregar
            </button>
          )}
          {mostrarCancelar && (
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
  onAvanzar,
  onCancelar,
  isPending,
  accionesExtra,
}: {
  columna: ColumnaInfo;
  pedidos: Pedido[];
  onAvanzar: (p: Pedido) => void;
  onCancelar: (p: Pedido) => void;
  isPending: boolean;
  accionesExtra?: React.ReactNode;
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
        {accionesExtra}
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
              onAvanzar={() => onAvanzar(pedido)}
              onCancelar={() => onCancelar(pedido)}
              isPending={isPending}
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
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [cleanedIds, setCleanedIds] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem('cleanedEntregados');
      return new Set<number>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<number>();
    }
  });
  const [busquedaEntregados, setBusquedaEntregados] = useState('');

  const { data: pedidos, isLoading, isError } = useQuery<Pedido[]>({
    queryKey: ['pedidos'],
    queryFn: getPedidos,
    refetchInterval: 15000,
    retry: 1,
  });

  const avanzarMutation = useMutation({
    mutationFn: ({ pedidoId, nuevoEstado }: { pedidoId: number; nuevoEstado: string }) =>
      avanzarEstado(pedidoId, nuevoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: (pedidoId: number) =>
      avanzarEstado(pedidoId, 'CANCELADO'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      setCancelandoId(null);
    },
  });

  function handleAvanzar(pedido: Pedido) {
    const transicion: Record<string, string> = {
      PENDIENTE: 'EN_PREP',
      CONFIRMADO: 'EN_PREP',
      EN_PREP: 'ENTREGADO',
      EN_CAMINO: 'ENTREGADO',
    };
    const nuevoEstado = transicion[pedido.estado_actual];
    if (!nuevoEstado) return;
    avanzarMutation.mutate({ pedidoId: pedido.id, nuevoEstado });
  }

  function handleCancelar(pedido: Pedido) {
    setCancelandoId(pedido.id);
  }

  function confirmarCancelar() {
    if (cancelandoId !== null) {
      cancelarMutation.mutate(cancelandoId);
    }
  }

  // Datos para entregados
  const entregados = useMemo(
    () => (pedidos ?? []).filter((p) => p.estado_actual === 'ENTREGADO'),
    [pedidos],
  );

  const entregadosLimpiados = useMemo(
    () => entregados.filter((p) => cleanedIds.has(p.id)),
    [entregados, cleanedIds],
  );

  const entregadosFiltrados = useMemo(
    () => entregadosLimpiados.filter((p) =>
      !busquedaEntregados ||
      p.usuario_nombre.toLowerCase().includes(busquedaEntregados.toLowerCase()) ||
      `#${p.id}`.includes(busquedaEntregados)
    ),
    [entregadosLimpiados, busquedaEntregados],
  );

  // Agrupar pedidos por columna (los limpiados no aparecen en la columna)
  const pedidosPorColumna = COLUMNAS.map((col) => ({
    columna: col,
    pedidos: (pedidos ?? []).filter(
      (p) => col.incluye.includes(p.estado_actual) && !(col.key === 'entregados' && cleanedIds.has(p.id)),
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
      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-2xl font-bold text-primary">Pedidos</h2>
          <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-semibold text-on-surface-variant">
            {totalActivos} activo{totalActivos !== 1 ? 's' : ''}
          </span>
          {entregados.length > 0 && (
            <span className="px-3 py-1 bg-[#10B981]/10 text-[#047857] rounded-full text-xs font-semibold">
              {entregados.length} entregado{entregados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-xs text-on-surface-variant/50">Auto-actualización cada 15s</span>
      </div>

      {/* ── Tablero Kanban (siempre 3 columnas) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {pedidosPorColumna.map(({ columna, pedidos: pedidosCol }) => (
          <Columna
            key={columna.key}
            columna={columna}
            pedidos={pedidosCol}
            onAvanzar={handleAvanzar}
            onCancelar={handleCancelar}
            isPending={avanzarMutation.isPending || cancelarMutation.isPending}
            accionesExtra={
              columna.key === 'entregados' && pedidosCol.length > 0 ? (
                <button
                  onClick={() => {
                    const nuevosIds = new Set(cleanedIds);
                    entregados.forEach((p) => nuevosIds.add(p.id));
                    setCleanedIds(nuevosIds);
                    localStorage.setItem('cleanedEntregados', JSON.stringify([...nuevosIds]));
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors"
                  title="Mover entregados al historial"
                >
                  <span className="material-symbols-outlined text-[14px]">cleaning_services</span>
                  Limpiar
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* ── Tabla de historial de entregados (siempre visible abajo cuando se limpió) ── */}
      {cleanedIds.size > 0 && entregadosLimpiados.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <h3 className="font-headline font-bold text-on-surface text-base">
                Historial de entregados
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/10 text-[#047857]">
                {entregadosLimpiados.length}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[16px]">search</span>
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente o N° pedido..."
                value={busquedaEntregados}
                onChange={(e) => setBusquedaEntregados(e.target.value)}
                className="bg-[#F5E6D3] border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-on-surface w-64 font-body text-xs placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-6 py-3 font-body font-semibold text-xs text-primary uppercase tracking-wider">N°</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs text-primary uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs text-primary uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs text-primary uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 font-body font-semibold text-xs text-primary uppercase tracking-wider">Entregado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {entregadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-sm">
                      No se encontraron pedidos para &quot;{busquedaEntregados}&quot;
                    </td>
                  </tr>
                ) : (
                  entregadosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-6 py-3 font-headline font-bold text-primary text-sm">#{p.id}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-outline-variant/10 bg-surface-container-high/30">
            <p className="text-xs text-on-surface-variant/60 text-right">
              Mostrando {entregadosFiltrados.length} de {entregadosLimpiados.length} pedidos entregados
            </p>
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
                disabled={cancelarMutation.isPending}
                className="px-4 py-2.5 bg-error text-white rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {cancelarMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
