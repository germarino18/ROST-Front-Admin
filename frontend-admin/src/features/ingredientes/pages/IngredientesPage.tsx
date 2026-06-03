/**
 * IngredientesPage.tsx — CRUD completo de ingredientes
 *
 * Funcionalidades:
 *   - Tabla con listado de ingredientes (nombre, descripción, alérgeno)
 *   - Barra de búsqueda y filtro por tipo (alérgeno / no alérgeno / todos)
 *   - Modal de creación/edición con formulario
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIngredientes, createIngrediente, updateIngrediente, deleteIngrediente } from '../../../api/ingredientes';
import Modal from '../../../components/Modal';
import type { IngredienteCreate, IngredienteUpdate } from '../../../types';

export default function IngredientesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterAlergeno, setFilterAlergeno] = useState<string>('');

  const { data: ingredientes, isLoading, isError } = useQuery({
    queryKey: ['ingredientes', search, filterAlergeno],
    queryFn: () =>
      getIngredientes({
        q: search || undefined,
        es_alergeno: filterAlergeno === 'true' ? true : filterAlergeno === 'false' ? false : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: IngredienteCreate) => createIngrediente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredienteUpdate }) => updateIngrediente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngrediente(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredientes'] }),
  });

  const [form, setForm] = useState<IngredienteCreate>({ nombre: '', descripcion: '', es_alergeno: false });

  function openCreate() {
    setEditingId(null);
    setForm({ nombre: '', descripcion: '', es_alergeno: false });
    setModalOpen(true);
  }

  function openEdit(item: NonNullable<typeof ingredientes>[number]) {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, descripcion: item.descripcion ?? '', es_alergeno: item.es_alergeno });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: IngredienteCreate = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      es_alergeno: form.es_alergeno,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: payload as IngredienteUpdate });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input type="text" placeholder="Buscar ingredientes..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-4 py-2.5 text-on-surface w-64 font-body text-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </span>
            <select value={filterAlergeno} onChange={(e) => setFilterAlergeno(e.target.value)}
              className="bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-8 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container appearance-none">
              <option value="">Todos</option>
              <option value="true">Alérgeno</option>
              <option value="false">No alérgeno</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </span>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary-container text-on-primary rounded-lg px-5 py-2.5 font-body font-semibold text-sm hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Ingrediente
        </button>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant py-8">Cargando ingredientes...</p>
      ) : isError ? (
        <p className="text-error py-8">Error al cargar ingredientes</p>
      ) : (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#4d6080] text-white">
              <tr>
                <th className="px-6 py-4 font-body font-semibold text-sm uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 font-body font-semibold text-sm uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 font-body font-semibold text-sm uppercase tracking-wider">Alérgeno</th>
                <th className="px-6 py-4 font-body font-semibold text-sm uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {ingredientes?.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          {item.es_alergeno ? 'warning' : 'liquor'}
                        </span>
                      </div>
                      <span className="font-body font-semibold text-primary">{item.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body text-on-surface-variant">{item.descripcion ?? '—'}</td>
                  <td className="px-6 py-4">
                    {item.es_alergeno ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">warning</span>Alérgeno
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>Seguro
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-primary hover:text-primary-container transition-colors p-1" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar este ingrediente?')) deleteMutation.mutate(item.id); }}
                        className="text-error hover:text-red-400 transition-colors p-1" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ingredientes?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">No hay ingredientes registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-1">Nombre</label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container" />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-1">Descripción</label>
            <textarea value={form.descripcion ?? ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value || null })} rows={3}
              className="w-full bg-[#F5E6D3] border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="es_alergeno" checked={form.es_alergeno}
              onChange={(e) => setForm({ ...form, es_alergeno: e.target.checked })}
              className="rounded border-outline-variant text-error focus:ring-error" />
            <label htmlFor="es_alergeno" className="font-body text-sm text-on-surface">Es alérgeno</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2.5 bg-primary-container text-on-primary rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
