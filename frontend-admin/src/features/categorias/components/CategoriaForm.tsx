/**
 * CategoriaForm.tsx — Formulario de creación/edición de categorías
 */

import type { CategoriaCreate, CategoriaUpdate } from '../../../types';

interface Props {
  form: CategoriaCreate;
  setForm: (f: CategoriaCreate) => void;
  editingId: number | null;
  categorias: Array<{ id: number; nombre: string }> | undefined;
  onCancel: () => void;
  onSubmit: (payload: CategoriaCreate | CategoriaUpdate) => void;
  isPending: boolean;
}

export default function CategoriaForm({ form, setForm, editingId, categorias, onCancel, onSubmit, isPending }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CategoriaCreate = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      parent_id: form.parent_id || null,
    };
    if (editingId !== null) {
      onSubmit(payload as CategoriaUpdate);
    } else {
      onSubmit(payload);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">Nombre</label>
        <input type="text" required value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container" />
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">Descripción</label>
        <textarea value={form.descripcion ?? ''}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value || null })}
          rows={3}
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container" />
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-on-surface mb-1">Categoría Padre</label>
        <select value={form.parent_id ?? ''}
          onChange={(e) => setForm({ ...form, parent_id: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container">
          <option value="">— Ninguna —</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id} disabled={c.id === editingId}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending}
          className="px-5 py-2.5 bg-primary-container text-on-primary rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
