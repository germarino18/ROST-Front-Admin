/**
 * DashboardChart.tsx — Componente reutilizable de gráficos para el dashboard
 *
 * Recibe el tipo (line | bar | doughnut), los datos formateados para Chart.js,
 * y opciones de personalización. Renderiza dentro de un card con el diseño
 * consistente del sistema ROST.
 *
 * Estados: renderiza el gráfico si hay data, o un mensaje vacío si no.
 *
 * Uso:
 *   <DashboardChart
 *     type="line"
 *     title="Evolución de pedidos"
 *     icon="timeline"
 *     data={lineData}
 *     options={lineOptions}
 *   />
 */

import { useEffect } from 'react';
import {
  Line,
  Bar,
  Doughnut,
  type ChartData,
  type ChartOptions,
} from 'react-chartjs-2';

// Registrar componentes de Chart.js
import './chartConfig';

type ChartType = 'line' | 'bar' | 'doughnut';

interface DashboardChartProps {
  type: ChartType;
  title: string;
  icon: string;
  data: ChartData<'line'> | ChartData<'bar'> | ChartData<'doughnut'>;
  options?: ChartOptions<'line'> & ChartOptions<'bar'> & ChartOptions<'doughnut'>;
  isEmpty?: boolean;
  emptyMessage?: string;
}

const CHART_TYPE_MAP: Record<ChartType, React.ElementType> = {
  line: Line,
  bar: Bar,
  doughnut: Doughnut,
};

export default function DashboardChart({
  type,
  title,
  icon,
  data,
  options,
  isEmpty = false,
  emptyMessage = 'Sin datos disponibles',
}: DashboardChartProps) {
  const ChartComponent = CHART_TYPE_MAP[type];
  const isDoughnut = type === 'doughnut';

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
      <h3 className="font-headline font-bold text-primary text-base mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        {title}
      </h3>

      {isEmpty ? (
        <p className="font-body text-sm text-on-surface-variant py-8 text-center">
          {emptyMessage}
        </p>
      ) : (
        <div className={isDoughnut ? 'max-w-[260px] mx-auto' : ''}>
          <ChartComponent data={data as any} options={options} />
        </div>
      )}
    </div>
  );
}
