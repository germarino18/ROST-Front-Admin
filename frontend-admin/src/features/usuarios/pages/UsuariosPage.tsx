import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import Modal from '../../../components/Modal';
import type { AdminUser, Rol } from '../../../types';

/** Roles que el admin puede asignar al crear usuarios (no puede crear ADMIN ni CLIENT) */
const ROLES_PERMITIDOS_CREAR = ['COCINERO', 'PEDIDOS', 'STOCK'] as const;

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', nombre: '', password: '', rol_codigo: '' });
  const [createError, setCreateError] = useState('');

  const { data: usuarios, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-usuarios'],
    queryFn: () => api.get('/admin/usuarios').then((r) => r.data),
  });

  const { data: rolesDisponibles } = useQuery<Rol[]>({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data),
  });

  /** Filtra los roles disponibles para mostrar solo los permitidos al crear */
  const rolesCrear = useMemo(
    () => (rolesDisponibles ?? []).filter((r) => (ROLES_PERMITIDOS_CREAR as readonly string[]).includes(r.codigo)),
    [rolesDisponibles],
  );

  const toggleActivo = useMutation({
    mutationFn: ({ userId, activo }: { userId: number; activo: boolean }) =>
      api.patch(`/admin/usuarios/${userId}`, { activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
  });

  const createUser = useMutation({
    mutationFn: (data: { email: string; nombre: string; password: string; rol_codigo: string }) =>
      api.post('/admin/usuarios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setCreateModalOpen(false);
      setCreateForm({ email: '', nombre: '', password: '', rol_codigo: '' });
      setCreateError('');
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail ?? 'Error al crear usuario');
    },
  });

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!createForm.email || !createForm.nombre || !createForm.password) {
      setCreateError('Completá todos los campos obligatorios');
      return;
    }
    if (!createForm.rol_codigo) {
      setCreateError('Seleccioná un rol para el usuario');
      return;
    }
    createUser.mutate(createForm);
  }

  function openDetail(user: AdminUser) {
    setSelectedUser(user);
    setUserDetailOpen(true);
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    STOCK: 'bg-blue-100 text-blue-700',
    PEDIDOS: 'bg-orange-100 text-orange-700',
    CAJERO: 'bg-teal-100 text-teal-700',
    COCINERO: 'bg-yellow-100 text-yellow-700',
    CLIENT: 'bg-green-100 text-green-700',
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    STOCK: 'Gestor Stock',
    PEDIDOS: 'Gestor Pedidos',
    CAJERO: 'Cajero',
    COCINERO: 'Cocinero',
    CLIENT: 'Cliente',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-body text-sm text-on-surface-variant">
          {usuarios?.length ?? 0} usuario{(usuarios?.length ?? 0) !== 1 ? 's' : ''} registrado{(usuarios?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4d6080] text-white rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant py-8">Cargando usuarios...</p>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 font-body font-semibold text-sm text-primary uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {usuarios?.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold uppercase">
                          {u.nombre?.charAt(0) ?? 'U'}
                        </div>
                        <div>
                          <button onClick={() => openDetail(u)} className="font-body font-semibold text-primary hover:underline text-left">{u.nombre}</button>
                          <p className="font-body text-xs text-on-surface-variant">ID: {u.id} · Registrado: {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body text-sm text-on-surface-variant">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.rol_codigo ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[u.rol_codigo] ?? 'bg-gray-100 text-gray-700'}`}>
                          {roleLabels[u.rol_codigo] ?? u.rol_codigo}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">Sin rol</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px]">cancel</span>Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          if (confirm(`¿${u.activo ? 'Desactivar' : 'Activar'} usuario "${u.nombre}"?`)) {
                            toggleActivo.mutate({ userId: u.id, activo: !u.activo });
                          }
                        }} className={`transition-colors p-1 ${u.activo ? 'text-error hover:text-red-400' : 'text-green-600 hover:text-green-400'}`} title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}>
                          <span className="material-symbols-outlined text-[20px]">{u.activo ? 'block' : 'check_circle'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios?.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No hay usuarios registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={userDetailOpen} onClose={() => setUserDetailOpen(false)} title="Detalle del Usuario">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/10">
              <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-white text-xl font-bold uppercase">
                {selectedUser.nombre?.charAt(0) ?? 'U'}
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-surface">{selectedUser.nombre}</h3>
                <p className="font-body text-sm text-on-surface-variant">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">ID</p>
                <p className="font-body text-sm font-semibold text-on-surface">#{selectedUser.id}</p>
              </div>
              <div className="bg-surface-container-high rounded-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Estado</p>
                <p className={`font-body text-sm font-semibold ${selectedUser.activo ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedUser.activo ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="bg-surface-container-high rounded-lg p-4 col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Registrado</p>
                <p className="font-body text-sm text-on-surface">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('es-AR') : '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-body font-semibold text-sm text-on-surface mb-2">Rol actual</h4>
              {selectedUser.rol_codigo ? (
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${roleColors[selectedUser.rol_codigo] ?? 'bg-gray-100 text-gray-700'}`}>
                  {roleLabels[selectedUser.rol_codigo] ?? selectedUser.rol_codigo}
                </span>
              ) : (
                <p className="text-sm text-on-surface-variant">Sin rol asignado</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Crear usuario ── */}
      <Modal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); setCreateError(''); }} title="Crear nuevo usuario">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {createError}
            </div>
          )}

          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={createForm.nombre}
              onChange={(e) => setCreateForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-high text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/40 transition-shadow"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-1">Email</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-high text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/40 transition-shadow"
              placeholder="ejemplo@rost.com"
            />
          </div>

          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-high text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/40 transition-shadow"
              placeholder="••••••••"
              minLength={8}
            />
            <p className="font-body text-xs text-on-surface-variant mt-1">Mínimo 8 caracteres</p>
          </div>

          {/* ── Selección de rol único ── */}
          <div>
            <label className="block font-body text-sm font-semibold text-on-surface mb-2">Rol</label>
            <select
              required
              value={createForm.rol_codigo}
              onChange={(e) => setCreateForm((f) => ({ ...f, rol_codigo: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-high text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/40 transition-shadow"
            >
              <option value="">Seleccionar rol...</option>
              {rolesCrear.map((rol) => (
                <option key={rol.codigo} value={rol.codigo}>
                  {roleLabels[rol.codigo] ?? rol.codigo}{rol.descripcion ? ` — ${rol.descripcion}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => { setCreateModalOpen(false); setCreateError(''); }}
              className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4d6080] text-white rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createUser.isPending ? (
                <>Creando...</>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Crear usuario
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
