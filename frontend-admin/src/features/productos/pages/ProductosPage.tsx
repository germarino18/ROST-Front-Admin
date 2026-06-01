/**
 * ProductosPage.tsx — CRUD completo de productos
 *
 * Funcionalidades:
 *   - Tabla con listado de productos (nombre, precio, stock, disponible)
 *   - Barra de búsqueda para filtrar por nombre
 *   - Modal de creación/edición con formulario completo
 *   - Solo ADMIN puede crear o eliminar productos (STOCK solo edita)
 *   - Link a detalle del producto en cada fila
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../../api/productos';
import { getCategorias } from '../../../api/categorias';
import { getIngredientes } from '../../../api/ingredientes';
import { getUnidadesMedida } from '../../../api/unidadesMedida';
import { useAuth } from '../../auth/context/AuthContext';
import Modal from '../../../components/Modal';
import ProductoForm from '../components/ProductoForm';
import type { Producto, ProductoCreate, ProductoUpdate } from '../../../types';

export default function ProductosPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [precioStr, setPrecioStr] = useState('0');
  const [stockStr, setStockStr] = useState('0');
  const [imagenUrl, setImagenUrl] = useState('');
  const [ingredientesMap, setIngredientesMap] = useState<Record<number, { cantidad: string; unidad_medida_id: number; es_removible: boolean }>>({});

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ['productos', search],
    queryFn: () => getProductos({ q: search || undefined }),
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => getCategorias(),
  });

  const { data: ingredientes } = useQuery({
    queryKey: ['ingredientes'],
    queryFn: () => getIngredientes(),
  });

  const { data: unidadesMedida } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: () => getUnidadesMedida(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductoCreate) => createProducto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) => updateProducto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProducto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  });

  const [form, setForm] = useState<ProductoCreate>({
    nombre: '',
    precio_base: 0,
    stock_cantidad: 0,
    disponible: true,
    descripcion: '',
    categorias: [],
    ingredientes: [],
  });

  function openCreate() {
    setEditingId(null);
    setPrecioStr('0');
    setStockStr('0');
    setImagenUrl('');
    setIngredientesMap({});
    setForm({
      nombre: '', precio_base: 0, stock_cantidad: 0, disponible: true,
      descripcion: '', imagenes_url: [], categorias: [], ingredientes: [],
    });
    setModalOpen(true);
  }

  function openEdit(p: Producto) {
    if (!p) return;
    setEditingId(p.id);
    setPrecioStr(String(p.precio_base));
    setStockStr(String(p.stock_cantidad));
    setImagenUrl(p.imagenes_url?.[0] ?? '');
    const ingMap: Record<number, { cantidad: string; unidad_medida_id: number; es_removible: boolean }> = {};
    p.ingredientes?.forEach((i) => {
      ingMap[i.ingrediente_id] = {
        cantidad: String(i.cantidad ?? ''),
        unidad_medida_id: i.unidad_medida_id,
        es_removible: i.es_removible ?? false,
      };
    });
    setIngredientesMap(ingMap);
    setForm({
      nombre: p.nombre, precio_base: p.precio_base, stock_cantidad: p.stock_cantidad,
      disponible: p.disponible, descripcion: p.descripcion, imagenes_url: p.imagenes_url ?? [],
      categorias: p.categorias?.map((c) => c.categoria_id) ?? [],
      ingredientes: p.ingredientes?.map((i) => ({
        ingrediente_id: i.ingrediente_id, cantidad: i.cantidad,
        unidad_medida_id: i.unidad_medida_id, es_removible: i.es_removible ?? false,
      })) ?? [],
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ingredientesArr = Object.entries(ingredientesMap)
      .filter(([_, val]) => val.cantidad !== '' && !isNaN(Number(val.cantidad)) && Number(val.cantidad) > 0)
      .map(([idStr, val]) => ({
        ingrediente_id: Number(idStr),
        cantidad: Number(val.cantidad),
        unidad_medida_id: val.unidad_medida_id,
        es_removible: val.es_removible,
      }));
    const data: ProductoCreate = {
      ...form,
      precio_base: parseFloat(precioStr) || 0,
      stock_cantidad: parseInt(stockStr, 10) || 0,
      imagenes_url: imagenUrl ? [imagenUrl] : [],
      ingredientes: ingredientesArr.length > 0 ? ingredientesArr : [],
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-4 py-2.5 text-on-surface w-72 font-body text-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary-container text-on-primary rounded-lg px-5 py-2.5 font-body font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Producto
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant py-8">Cargando productos...</p>
      ) : isError ? (
        <p className="text-error py-8">Error al cargar productos</p>
      ) : (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Disponible</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {productos?.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.imagenes_url?.[0] ? (
                        <img src={p.imagenes_url[0]} alt="" className="w-8 h-8 rounded object-cover border border-outline-variant/20"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">coffee</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <Link to={`/admin/productos/${p.id}`} className="font-body font-semibold text-primary hover:underline">
                          {p.nombre}
                        </Link>
                        {p.categorias && p.categorias.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.categorias.slice(0, 2).map((pc) => (
                              <span key={pc.categoria_id} className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-semibold">
                                {pc.categoria?.nombre ?? `#${pc.categoria_id}`}
                              </span>
                            ))}
                            {p.categorias.length > 2 && (
                              <span className="text-[10px] text-on-surface-variant">+{p.categorias.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body text-on-surface-variant">${p.precio_base.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-body ${p.stock_cantidad === 0 ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                      {p.stock_cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.disponible ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-primary hover:text-primary-container transition-colors p-1" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      {isAdmin && (
                        <button onClick={() => { if (confirm('¿Eliminar este producto?')) deleteMutation.mutate(p.id); }}
                          className="text-error hover:text-red-400 transition-colors p-1" title="Eliminar">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {productos?.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No hay productos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit}>
          <ProductoForm
            form={form} setForm={setForm} editingId={editingId}
            precioStr={precioStr} setPrecioStr={setPrecioStr}
            stockStr={stockStr} setStockStr={setStockStr}
            imagenUrl={imagenUrl} setImagenUrl={setImagenUrl}
            ingredientesMap={ingredientesMap} setIngredientesMap={setIngredientesMap}
            categorias={categorias} ingredientes={ingredientes} unidadesMedida={unidadesMedida}
            modalOpen={modalOpen} setModalOpen={setModalOpen}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  );
}
