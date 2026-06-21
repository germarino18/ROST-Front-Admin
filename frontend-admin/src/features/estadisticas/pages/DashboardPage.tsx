/**
 * DashboardPage.tsx — Panel de estadísticas del admin
 *
 * Muestra:
 *   - Cards resumen (pedidos_hoy, ingresos_hoy, pedidos_semana, ingresos_semana)
 *   - Pedidos por estado (gráfico de barras simple vía flex)
 *   - Top 5 productos más vendidos
 *   - Productos con stock bajo
 *   - Pedidos de los últimos 7 días (serie temporal)
 *
 * Solo accesible para ADMIN.
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboard, type DashboardRead } from '../../../api/estadisticas';
import { type ChartData, type ChartOptions } from 'chart.js';
import DashboardChart from '../../../components/charts/DashboardChart';

/* ─── Helpers de presentación ─── */

function formatearPesos(monto: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto);
}

const ESTADOS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  EN_PREP: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADOS_COLORS: Record<string, string> = {
  PENDIENTE: '#F59E0B',
  CONFIRMADO: '#8B5CF6',
  EN_PREP: '#3B82F6',
  LISTO: '#10B981',
  ENTREGADO: '#059669',
  CANCELADO: '#EF4444',
};

/* ─── Mock data & helpers para gráficos ─── */
/* Se usa real si la API responde, mock como fallback visual */
const MOCK_ULTIMOS_7_DIAS = [
  { fecha: '2026-06-15', cantidad: 12, ingresos: 45200 },
  { fecha: '2026-06-16', cantidad: 18, ingresos: 67800 },
  { fecha: '2026-06-17', cantidad: 8, ingresos: 32100 },
  { fecha: '2026-06-18', cantidad: 22, ingresos: 89100 },
  { fecha: '2026-06-19', cantidad: 15, ingresos: 56300 },
  { fecha: '2026-06-20', cantidad: 25, ingresos: 102400 },
  { fecha: '2026-06-21', cantidad: 20, ingresos: 78500 },
];

const MOCK_PRODUCTOS = [
  { producto_id: 1, nombre: 'Muzzarella', cantidad_vendida: 45, ingresos_generados: 112500, stock_actual: 23 },
  { producto_id: 2, nombre: 'Napolitana', cantidad_vendida: 38, ingresos_generados: 106400, stock_actual: 15 },
  { producto_id: 3, nombre: 'Especial ROST', cantidad_vendida: 32, ingresos_generados: 128000, stock_actual: 8 },
  { producto_id: 4, nombre: 'Fugazzeta', cantidad_vendida: 28, ingresos_generados: 84000, stock_actual: 18 },
  { producto_id: 5, nombre: 'Calabresa', cantidad_vendida: 22, ingresos_generados: 77000, stock_actual: 4 },
];

const MOCK_PEDIDOS_POR_ESTADO: Record<string, number> = {
  PENDIENTE: 5,
  CONFIRMADO: 8,
  EN_PREP: 12,
  LISTO: 3,
  ENTREGADO: 18,
  CANCELADO: 2,
};

const CHART_COLORS = [
  '#354867', '#4d6080', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
];

/* ─── Cards resumen ─── */

function Card({
  titulo,
  valor,
  icono,
  color,
  subtitulo,
}: {
  titulo: string;
  valor: string;
  icono: string;
  color: string;
  subtitulo?: string;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-5 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <span className="material-symbols-outlined text-[24px]" style={{ color }}>
          {icono}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
          {titulo}
        </p>
        <p className="font-headline text-2xl font-bold text-primary">{valor}</p>
        {subtitulo && <p className="font-body text-xs text-on-surface-variant mt-0.5">{subtitulo}</p>}
      </div>
    </div>
  );
}

/* ─── Barra para pedidos por estado ─── */

function BarraEstado({ estado, cantidad, max }: { estado: string; cantidad: number; max: number }) {
  const pct = max > 0 ? (cantidad / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 font-body text-sm text-on-surface shrink-0">{ESTADOS_LABELS[estado] ?? estado}</span>
      <div className="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: ESTADOS_COLORS[estado] ?? '#8B5CF6' }}
        />
      </div>
      <span className="w-10 text-right font-body text-sm font-semibold text-on-surface">{cantidad}</span>
    </div>
  );
}

/* ─── Loading Skeleton ─── */

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 h-64" />
        <div className="bg-surface-container-lowest rounded-xl p-6 h-64" />
      </div>
    </div>
  );
}

/* ─── Página principal ─── */

export default function DashboardPage() {
  const { data: d, isLoading, isError, refetch } = useQuery<DashboardRead>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60000, // auto-refresh cada 1 min
  });

  if (isLoading) {
    return (
      <div>
        <p className="font-body text-sm text-on-surface-variant mb-4">Cargando estadísticas...</p>
        <Skeleton />
      </div>
    );
  }

  if (isError || !d) {
    return (
      <div className="text-center py-12">
        <p className="font-headline text-lg font-bold text-error">Error al cargar el dashboard</p>
        <p className="font-body text-sm text-on-surface-variant mt-1">Verificá que el servidor esté corriendo</p>
        <button onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          Reintentar
        </button>
      </div>
    );
  }

  const maxEstado = Math.max(...Object.values(d.pedidos_por_estado), 1);

  /* ── Preparación de datos para gráficos ── */
  /* Usa datos reales de la API; si vienen vacíos, usa mock para visualización */
  const dias = d.pedidos_ultimos_7_dias.length > 0 ? d.pedidos_ultimos_7_dias : MOCK_ULTIMOS_7_DIAS;
  const prods = d.productos_mas_vendidos.length > 0 ? d.productos_mas_vendidos : MOCK_PRODUCTOS;
  const estados = Object.keys(d.pedidos_por_estado).length > 0 ? d.pedidos_por_estado : MOCK_PEDIDOS_POR_ESTADO;

  const lineData: ChartData<'line'> = {
    labels: dias.map(dia => {
      const fecha = new Date(dia.fecha + 'T00:00:00');
      return fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Pedidos',
        data: dias.map(dia => dia.cantidad),
        borderColor: '#354867',
        backgroundColor: 'rgba(53, 72, 103, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#354867',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#354867',
        titleFont: { family: 'Manrope', size: 12 },
        bodyFont: { family: 'Manrope', size: 12 },
        cornerRadius: 8,
        padding: 10,
        callbacks: { label: ctx => `${ctx.parsed.y} pedidos` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Manrope', size: 11 }, color: '#44474d' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'Manrope', size: 11 }, color: '#44474d', stepSize: 1 },
      },
    },
  };

  const barData: ChartData<'bar'> = {
    labels: prods.map(p => p.nombre),
    datasets: [
      {
        label: 'Vendidos',
        data: prods.map(p => p.cantidad_vendida),
        backgroundColor: prods.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#354867',
        titleFont: { family: 'Manrope', size: 12 },
        bodyFont: { family: 'Manrope', size: 12 },
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'Manrope', size: 11 }, color: '#44474d', stepSize: 1 },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Manrope', size: 11 }, color: '#44474d' },
      },
    },
  };

  const doughnutData: ChartData<'doughnut'> = {
    labels: Object.keys(estados).map(e => ESTADOS_LABELS[e] ?? e),
    datasets: [
      {
        data: Object.values(estados),
        backgroundColor: Object.keys(estados).map(e => ESTADOS_COLORS[e] ?? '#8B5CF6'),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Manrope', size: 11 },
          color: '#44474d',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#354867',
        titleFont: { family: 'Manrope', size: 12 },
        bodyFont: { family: 'Manrope', size: 12 },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: ctx => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* ── Fila de cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          titulo="Pedidos hoy"
          valor={String(d.pedidos_hoy)}
          icono="today"
          color="#8B5CF6"
          subtitulo="total del día"
        />
        <Card
          titulo="Ingresos hoy"
          valor={formatearPesos(d.ingresos_hoy)}
          icono="payments"
          color="#10B981"
          subtitulo="ventas del día"
        />
        <Card
          titulo="Pedidos (7 días)"
          valor={String(d.pedidos_semana)}
          icono="receipt_long"
          color="#3B82F6"
          subtitulo="última semana"
        />
        <Card
          titulo="Ingresos (7 días)"
          valor={formatearPesos(d.ingresos_semana)}
          icono="trending_up"
          color="#F59E0B"
          subtitulo="última semana"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Pedidos por estado ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <h3 className="font-headline font-bold text-primary text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            Pedidos por estado
          </h3>
          <div className="space-y-3">
            {Object.entries(d.pedidos_por_estado).length === 0 ? (
              <p className="text-sm text-on-surface-variant">Sin pedidos registrados</p>
            ) : (
              Object.entries(d.pedidos_por_estado).map(([estado, cantidad]) => (
                <BarraEstado key={estado} estado={estado} cantidad={cantidad} max={maxEstado} />
              ))
            )}
          </div>
        </div>

        {/* ── Últimos 7 días ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <h3 className="font-headline font-bold text-primary text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            Últimos 7 días
          </h3>
          {d.pedidos_ultimos_7_dias.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Sin datos en los últimos 7 días</p>
          ) : (
            <div className="space-y-3">
              {d.pedidos_ultimos_7_dias.map((dia) => {
                const fecha = new Date(dia.fecha + 'T00:00:00');
                const label = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <div key={dia.fecha} className="flex items-center justify-between py-1 border-b border-outline-variant/5 last:border-0">
                    <span className="font-body text-sm text-on-surface-variant capitalize min-w-[7rem]">{label}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-body text-xs text-on-surface-variant">
                        <strong className="text-on-surface">{dia.cantidad}</strong> pedidos
                      </span>
                      <span className="font-headline text-sm font-bold text-[#10B981] min-w-[5rem] text-right">
                        {formatearPesos(dia.ingresos)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top 5 productos más vendidos ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <h3 className="font-headline font-bold text-primary text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
            Productos más vendidos
          </h3>
          {d.productos_mas_vendidos.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Sin ventas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">#</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Producto</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Vendidos</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Ingresos</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {d.productos_mas_vendidos.map((p, i) => (
                    <tr key={p.producto_id} className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container-high/30 transition-colors">
                      <td className="py-2 font-headline font-bold text-primary text-sm w-8">{i + 1}</td>
                      <td className="py-2 font-body text-sm text-on-surface">{p.nombre}</td>
                      <td className="py-2 font-body text-sm text-on-surface text-right">{p.cantidad_vendida}</td>
                      <td className="py-2 font-headline text-sm font-bold text-[#10B981] text-right">{formatearPesos(p.ingresos_generados)}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock_actual <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {p.stock_actual}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Stock bajo ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <h3 className="font-headline font-bold text-primary text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            Stock bajo
          </h3>
          {d.stock_bajo.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-on-surface-variant/50">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
              <p className="font-body text-sm mt-2">Todo en stock suficiente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Producto</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Stock</th>
                    <th className="pb-2 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {d.stock_bajo.map((p) => (
                    <tr key={p.producto_id} className="border-b border-outline-variant/5 last:border-0">
                      <td className="py-2 font-body text-sm text-on-surface">{p.nombre}</td>
                      <td className="py-2 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          {p.stock_cantidad}
                        </span>
                      </td>
                      <td className="py-2 font-headline text-sm font-bold text-primary text-right">{formatearPesos(p.precio_base)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardChart
          type="line"
          title="Evolución de pedidos"
          icon="timeline"
          data={lineData}
          options={lineOptions}
        />
        <DashboardChart
          type="bar"
          title="Productos más vendidos"
          icon="bar_chart"
          data={barData}
          options={barOptions}
        />
        <DashboardChart
          type="doughnut"
          title="Pedidos por estado"
          icon="pie_chart"
          data={doughnutData}
          options={doughnutOptions}
        />
      </div>
    </div>
  );
}
