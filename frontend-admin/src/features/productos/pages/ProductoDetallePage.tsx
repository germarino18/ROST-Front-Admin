/**
 * ProductoDetallePage.tsx — Vista detalle de un producto
 *
 * Muestra la información completa de un producto incluyendo:
 *   - Nombre, descripción, precio, stock
 *   - Badges de disponible/no disponible/sin stock
 *   - Imagen principal
 *   - Categorías con badge "Principal"
 *   - Ingredientes con cantidad, unidad de medida, indicador de alérgeno y removible
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductoById } from '../../../api/productos';

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productoId = parseInt(id ?? '0', 10);

  const { data: producto, isLoading, isError } = useQuery({
    queryKey: ['producto', productoId],
    queryFn: () => getProductoById(productoId),
    enabled: !isNaN(productoId) && productoId > 0,
  });

  if (isLoading) return <p className="text-on-surface-variant">Cargando producto...</p>;
  if (isError || !producto) return <p className="text-error">Error al cargar el producto</p>;

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/admin/productos')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 font-body">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver a productos
      </button>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-headline text-2xl font-bold text-primary">{producto.nombre}</h2>
            {producto.descripcion && <p className="font-body text-on-surface-variant mt-2">{producto.descripcion}</p>}
          </div>
          <div className="flex items-center gap-2">
            {producto.disponible ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">cancel</span>No disponible
              </span>
            )}
            {producto.stock_cantidad === 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>Sin stock
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-container-high rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Precio Base</p>
            <p className="font-headline text-xl font-bold text-primary">${producto.precio_base.toFixed(2)}</p>
          </div>
          <div className="bg-surface-container-high rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Stock</p>
            <p className="font-headline text-xl font-bold text-primary">{producto.stock_cantidad} unid.</p>
          </div>
        </div>

        {producto.imagenes_url && producto.imagenes_url.length > 0 && (
          <div className="mb-8">
            <img src={producto.imagenes_url[0]} alt={producto.nombre}
              className="w-full max-h-80 object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        {producto.categorias && producto.categorias.length > 0 && (
          <div className="mb-8">
            <h3 className="font-body font-semibold text-sm text-on-surface mb-3">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              {producto.categorias.map((pc) => (
                <span key={pc.categoria_id} className="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px] mr-1">category</span>
                  {pc.categoria?.nombre ?? `Categoría #${pc.categoria_id}`}
                  {pc.es_principal && <span className="ml-1.5 px-1.5 py-0.5 bg-primary-container text-on-primary-container rounded text-[9px] uppercase font-bold tracking-wider">Principal</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {producto.ingredientes && producto.ingredientes.length > 0 && (
          <div>
            <h3 className="font-body font-semibold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">list_alt</span>
              Ingredientes
            </h3>
            <div className="space-y-2">
              {producto.ingredientes.map((pi) => (
                <div key={pi.ingrediente_id} className="flex items-center justify-between bg-surface-container-high rounded-lg px-4 py-3 transition-colors hover:bg-surface-container-highest">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        {pi.ingrediente?.es_alergeno ? 'warning' : 'liquor'}
                      </span>
                    </div>
                    <span className="font-body text-sm text-on-surface">
                      {pi.ingrediente?.nombre ?? `Ingrediente #${pi.ingrediente_id}`}
                    </span>
                    {pi.ingrediente?.es_alergeno && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-error-container text-on-error-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">warning</span>Alérgeno
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-sm font-semibold text-primary">{pi.cantidad} {pi.unidad_medida?.simbolo ?? ''}</span>
                    {pi.es_removible && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-on-surface-variant bg-surface-container-lowest rounded px-1.5 py-0.5">
                        <span className="material-symbols-outlined text-[12px]">unfold_more</span>removible
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
