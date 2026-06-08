/**
 * types/index.ts — Tipos compartidos del Frontend Admin de ROST
 *
 * Define las interfaces TypeScript para todas las entidades del dominio:
 * Producto, Categoría, Ingrediente, UnidadMedida, AdminUser, Rol.
 * También incluye las variantes Create (campos requeridos para crear)
 * y Update (todos los campos opcionales para PATCH).
 */

export interface UnidadMedida {
  id: number;
  nombre: string;
  simbolo: string;
  tipo: string;
  created_at: string;
}

export interface UnidadMedidaCreate {
  nombre: string;
  simbolo: string;
  tipo: string;
}

export interface UnidadMedidaUpdate {
  nombre?: string;
  simbolo?: string;
  tipo?: string;
}

export interface Categoria {
  id: number;
  parent_id: number | null;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
  hijos?: Categoria[];
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string | null;
  parent_id?: number | null;
  imagen_url?: string | null;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string | null;
  parent_id?: number | null;
  imagen_url?: string | null;
}

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
  created_at: string;
  updated_at: string;
}

export interface IngredienteCreate {
  nombre: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
}

export interface ProductoCategoria {
  producto_id: number;
  categoria_id: number;
  es_principal: boolean;
  created_at: string;
  categoria?: Categoria;
}

export interface ProductoIngrediente {
  producto_id: number;
  ingrediente_id: number;
  cantidad: number;
  unidad_medida_id: number;
  es_removible: boolean;
  created_at: string;
  ingrediente?: Ingrediente;
  unidad_medida?: UnidadMedida;
}

export interface Producto {
  id: number;
  unidad_venta_id: number | null;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagenes_url: string[] | null;
  stock_cantidad: number;
  disponible: boolean;
  created_at: string;
  updated_at: string;
  categorias?: ProductoCategoria[];
  ingredientes?: ProductoIngrediente[];
  unidad_venta?: UnidadMedida;
}

export interface ProductoIngredienteInput {
  ingrediente_id: number;
  cantidad: number;
  unidad_medida_id: number;
  es_removible?: boolean;
}

export interface ProductoCreate {
  nombre: string;
  precio_base: number;
  stock_cantidad?: number;
  disponible?: boolean;
  unidad_venta_id?: number | null;
  descripcion?: string | null;
  imagenes_url?: string[];
  categorias?: number[];
  ingredientes?: ProductoIngredienteInput[];
}

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
  created_at: string | null;
  rol_codigo: string | null;
}

export interface Rol {
  codigo: string;
  descripcion: string;
}

export interface ProductoUpdate {
  nombre?: string;
  precio_base?: number;
  stock_cantidad?: number;
  disponible?: boolean;
  unidad_venta_id?: number | null;
  descripcion?: string | null;
  categorias?: number[];
  ingredientes?: ProductoIngredienteInput[];
}

export interface DetallePedido {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_snapshot: number | null;
  nombre_snapshot: string;
}

export interface HistorialEstado {
  id: number;
  estado: string;
  fecha: string | null;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  estado_actual: string;
  total: number | null;
  created_at: string;
  updated_at?: string | null;
  detalles: DetallePedido[];
  historial: HistorialEstado[];
}
