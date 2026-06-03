
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/admin/productos', icon: 'coffee', label: 'Productos', roles: ['ADMIN', 'STOCK'] },
  { to: '/admin/ingredientes', icon: 'liquor', label: 'Ingredientes', roles: ['ADMIN'] },
  { to: '/admin/categorias', icon: 'category', label: 'Categorías', roles: ['ADMIN'] },
  { to: '/admin/pedidos', icon: 'orders', label: 'Pedidos', roles: ['ADMIN', 'PEDIDOS', 'COCINERO', 'CAJERO'] },
  { to: '/admin/usuarios', icon: 'group', label: 'Usuarios', roles: ['ADMIN'] },
];

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/productos': 'Productos',
  '/admin/ingredientes': 'Ingredientes',
  '/admin/categorias': 'Categorías',
  '/admin/pedidos': 'Pedidos',
  '/admin/usuarios': 'Control de Usuarios',
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const currentTitle = pageTitles[location.pathname] ?? 'Panel de Control';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex flex-col h-screen w-64 bg-surface-container border-r border-outline-variant/20 flex-shrink-0">
        <div className="px-6 py-8 border-b border-outline-variant/10 flex justify-center">
          <img src="/logo.png" alt="ROST" className="h-14" />
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems
            .filter((item) => item.roles.some((r) => usuario?.roles?.some((ur) => ur.rol_codigo === r)))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-body text-sm ${
                    isActive
                      ? 'bg-[#4d6080] text-white font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-outline-variant/10 px-4 py-4 space-y-3">
          {usuario && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4d6080] flex items-center justify-center text-white text-xs font-bold uppercase">
                {usuario.nombre?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-on-surface truncate">{usuario.nombre}</p>
                <p className="font-body text-xs text-on-surface-variant truncate">{usuario.email}</p>
              </div>
            </div>
          )}
          <a
            href="http://localhost:5174"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors font-body"
          >
            <span className="material-symbols-outlined text-[18px]">store</span>
            Ir a la tienda
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors font-body"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar sesión
          </button>
          <div className="flex items-center gap-2 px-3 pt-1">
            <span className="font-body text-[11px] text-on-surface-variant/50">ROST Admin v2.0</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 h-screen overflow-y-auto bg-[#FFEDDB]">
        <div className="p-6">
          <header className="mb-8">
            <h2 className="font-headline text-3xl font-bold text-primary">{currentTitle}</h2>
          </header>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
