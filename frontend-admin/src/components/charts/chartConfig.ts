/**
 * chartConfig.ts — Registro global de componentes de Chart.js
 *
 * Chart.js v4 requiere registro explícito de componentes.
 * Este archivo centraliza ese registro para toda la app.
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  // Controladores
  LineController,
  BarController,
  DoughnutController,
  // Elementos
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  // Escalas
  CategoryScale,
  LinearScale,
  // Utilidades
  Filler,
  Title,
  Tooltip,
  Legend,
);
