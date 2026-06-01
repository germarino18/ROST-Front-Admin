/**
 * CategoriasPage.tsx — CRUD completo de categorías
 *
 * Funcionalidades:
 *   - Tabla con listado de categorías (nombre, descripción, categoría padre)
 *   - Barra de búsqueda para filtrar por nombre
 *   - Modal de creación/edición con formulario reutilizable
 *   - Jerarquía: una categoría puede tener una categoría padre
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../../api/categorias';
import Modal from '../../../components/Modal';
import CategoriaForm from '../components/CategoriaForm';
import type { CategoriaCreate, CategoriaUpdate } from '../../../types';

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data: categorias, isLoading, isError } = useQuery({
    queryKey: ['categorias', search],
    queryFn: () => getCategorias({ q: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoriaCreate) => createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaUpdate }) => updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  });

  const [form, setForm] = useState<CategoriaCreate>({ nombre: '', descripcion: '', parent_id: null });

  function openCreate() {
    setEditingId(null);
    setForm({ nombre: '', descripcion: '', parent_id: null });
    setModalOpen(true);
  }

  function openEdit(item: NonNullable<typeof categorias>[number]) {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, descripcion: item.descripcion ?? '', parent_id: item.parent_id });
    setModalOpen(true);
  }

  function getParentName(parentId: number | null): string {
    if (parentId === null) return '—';
    const parent = categorias?.find((c) => c.id === parentId);
    return parent?.nombre ?? `ID ${parentId}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input type="text" placeholder="Buscar categorías..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#F5E6D3] border border-outline-variant rounded-lg pl-9 pr-4 py-2.5 text-on-surface w-72 font-body text-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container" />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary-container text-on-primary rounded-lg px-5 py-2.5 font-body font-semibold text-sm hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Categoría
        </button>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant py-8">Cargando categorías...</p>
      ) : isError ? (
        <p className="text-error py-8">Error al cargar categorías</p>
      ) : (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Categoría Padre</th>
                <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {categorias?.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-primary">category</span>
                      </div>
                      <span className="font-body font-semibold text-primary">{item.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-body text-on-surface-variant">{item.descripcion ?? '—'}</td>
                  <td className="px-6 py-4">
                    {item.parent_id ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px] mr-1">subdirectory_arrow_right</span>
                        {getParentName(item.parent_id)}
                      </span>
                    ) : <span className="text-on-surface-variant text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-primary hover:text-primary-container transition-colors p-1" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => { if (confirm('¿Eliminar esta categoría?')) deleteMutation.mutate(item.id); }}
                        className="text-error hover:text-red-400 transition-colors p-1" title="Eliminar">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">No hay categorías registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Categoría' : 'Nueva Categoría'}>
        <CategoriaForm
          form={form} setForm={setForm} editingId={editingId}
          categorias={categorias}
          onCancel={() => setModalOpen(false)}
          onSubmit={(data) => {
            if (editingId !== null) updateMutation.mutate({ id: editingId, data: data as CategoriaUpdate });
            else createMutation.mutate(data as CategoriaCreate);
          }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
