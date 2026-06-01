/**
 * ProductoForm.tsx — Formulario de creación/edición de productos
 *
 * Contiene los campos: nombre, descripción, precio, stock, disponible,
 * imagen URL, categorías (checkboxes), ingredientes con cantidad/unidad/removible.
 *
 * El estado del string de ingredientes (cantidad, unidad, removible) se maneja
 * mediante un map para evitar re-renders completos al editar un ingrediente.
 */

import type { ProductoCreate, Categoria, Ingrediente, UnidadMedida } from '../../../types';
import { useCallback } from 'react';

type IngMap = Record<number, { cantidad: string; unidad_medida_id: number; es_removible: boolean }>;

interface Props {
  form: ProductoCreate;
  setForm: (f: ProductoCreate) => void;
  editingId: number | null;
  precioStr: string;
  setPrecioStr: (s: string) => void;
  stockStr: string;
  setStockStr: (s: string) => void;
  imagenUrl: string;
  setImagenUrl: (s: string) => void;
  ingredientesMap: IngMap;
  setIngredientesMap: React.Dispatch<React.SetStateAction<IngMap>>;
  categorias: Categoria[] | undefined;
  ingredientes: Ingrediente[] | undefined;
  unidadesMedida: UnidadMedida[] | undefined;
  modalOpen: boolean;
  setModalOpen: (o: boolean) => void;
  isPending: boolean;
}

export default function ProductoForm({
  form, setForm, editingId: _editingId,
  precioStr, setPrecioStr, stockStr, setStockStr,
  imagenUrl, setImagenUrl,
  ingredientesMap, setIngredientesMap,
  categorias, ingredientes, unidadesMedida,
  modalOpen: _modalOpen, setModalOpen, isPending,
}: Props) {

  const normalizePrecio = useCallback(() => {
    const num = parseFloat(precioStr);
    if (!isNaN(num) && num >= 0) {
      const normalized = num.toFixed(2);
      setPrecioStr(normalized);
      setForm({ ...form, precio_base: num });
    }
  }, [precioStr, form, setForm, setPrecioStr]);

  const normalizeStock = useCallback(() => {
    const num = parseInt(stockStr, 10);
    if (!isNaN(num) && num >= 0) {
      setStockStr(String(num));
      setForm({ ...form, stock_cantidad: num });
    }
  }, [stockStr, form, setForm, setStockStr]);

  function toggleCategoria(catId: number) {
    const current = form.categorias ?? [];
    if (current.includes(catId)) {
      setForm({ ...form, categorias: current.filter((id) => id !== catId) });
    } else {
      setForm({ ...form, categorias: [...current, catId] });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">Nombre</label>
        <input
          type="text"
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">Descripción</label>
        <textarea
          value={form.descripcion ?? ''}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value || null })}
          rows={3}
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-body text-sm font-semibold text-on-surface mb-1">Precio Base ($)</label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={precioStr}
            onChange={(e) => setPrecioStr(e.target.value)}
            onBlur={normalizePrecio}
            placeholder="0.00"
            className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
        <div>
          <label className="block font-body text-sm font-semibold text-on-surface mb-1">Stock</label>
          <input
            type="text"
            inputMode="numeric"
            value={stockStr}
            onChange={(e) => setStockStr(e.target.value)}
            onBlur={normalizeStock}
            placeholder="0"
            className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="disponible"
          checked={form.disponible}
          onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
          className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
        />
        <label htmlFor="disponible" className="font-body text-sm text-on-surface">Disponible</label>
        {stockStr !== '' && parseInt(stockStr) === 0 && (
          <span className="text-xs text-error ml-2">(sin stock → no disponible automáticamente)</span>
        )}
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-2">Categorías</label>
        {categorias && categorias.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((c) => {
              const selected = form.categorias?.includes(c.id) ?? false;
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selected
                      ? 'bg-primary-container/10 border-primary-container text-primary'
                      : 'bg-[#F5E6D3] border-outline-variant text-on-surface hover:bg-[#efe0cd]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCategoria(c.id)}
                    className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
                  />
                  <span className="font-body text-sm">{c.nombre}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Cargando categorías...</p>
        )}
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">URL de Imagen (opcional)</label>
        <input
          type="text"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
        {imagenUrl && (
          <div className="mt-2">
            <img
              src={imagenUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-outline-variant"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-2">Ingredientes</label>
        {ingredientes && ingredientes.length > 0 && unidadesMedida ? (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {ingredientes.map((ing) => {
              const selected = ingredientesMap[ing.id] !== undefined;
              return (
                <div
                  key={ing.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selected
                      ? 'bg-primary-container/10 border-primary-container'
                      : 'bg-[#F5E6D3] border-outline-variant'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const next = { ...ingredientesMap };
                        if (selected) {
                          delete next[ing.id];
                        } else {
                          const defaultUdM = unidadesMedida.find((u) => u.tipo === 'masa' || u.tipo === 'volumen');
                          next[ing.id] = {
                            cantidad: '',
                            unidad_medida_id: defaultUdM?.id ?? (unidadesMedida[0]?.id ?? 0),
                            es_removible: false,
                          };
                        }
                        setIngredientesMap(next);
                      }}
                      className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
                    />
                    <span className="font-body text-sm text-on-surface">{ing.nombre}</span>
                    {ing.es_alergeno && (
                      <span className="px-2 py-0.5 bg-error-container text-on-error-container rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Alérgeno
                      </span>
                    )}
                  </div>
                  {selected && (
                    <div className="grid grid-cols-3 gap-2 ml-6">
                      <div>
                        <label className="block font-body text-[11px] text-on-surface-variant mb-0.5">Cantidad</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={ingredientesMap[ing.id].cantidad}
                          onChange={(e) =>
                            setIngredientesMap((prev) => ({
                              ...prev,
                              [ing.id]: { ...prev[ing.id], cantidad: e.target.value },
                            }))
                          }
                          placeholder="0"
                          className="w-full bg-white border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary-container"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-[11px] text-on-surface-variant mb-0.5">Unidad</label>
                        <select
                          value={ingredientesMap[ing.id].unidad_medida_id}
                          onChange={(e) =>
                            setIngredientesMap((prev) => ({
                              ...prev,
                              [ing.id]: { ...prev[ing.id], unidad_medida_id: Number(e.target.value) },
                            }))
                          }
                          className="w-full bg-white border border-outline-variant rounded px-2 py-1.5 text-on-surface font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary-container"
                        >
                          {unidadesMedida.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.simbolo} ({u.nombre})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ingredientesMap[ing.id].es_removible}
                            onChange={(e) =>
                              setIngredientesMap((prev) => ({
                                ...prev,
                                [ing.id]: { ...prev[ing.id], es_removible: e.target.checked },
                              }))
                            }
                            className="rounded border-outline-variant text-primary-container focus:ring-primary-container"
                          />
                          <span className="font-body text-xs text-on-surface-variant">Removible</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Cargando ingredientes...</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-primary-container text-on-primary rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
