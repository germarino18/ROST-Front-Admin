import api from './client';

export interface PedidoDiario {
    fecha: string;
    cantidad: number;
    ingresos: number;
}

export interface ProductoTop {
    producto_id: number;
    nombre: string;
    cantidad_vendida: number;
    ingresos_generados: number;
    stock_actual: number;
}

export interface StockBajo {
    producto_id: number;
    nombre: string;
    stock_cantidad: number;
    precio_base: number;
}

export interface DashboardRead {
    pedidos_hoy: number;
    ingresos_hoy: number;
    pedidos_semana: number;
    ingresos_semana: number;
    pedidos_por_estado: Record<string, number>;
    productos_mas_vendidos: ProductoTop[];
    stock_bajo: StockBajo[];
    pedidos_ultimos_7_dias: PedidoDiario[];
}

/** GET /admin/estadisticas — Dashboard completo */
export async function getDashboard(): Promise<DashboardRead> {
    const res = await api.get<DashboardRead>('/admin/estadisticas');
    return res.data;
}
