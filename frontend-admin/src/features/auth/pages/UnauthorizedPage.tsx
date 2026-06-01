/**
 * UnauthorizedPage.tsx — Pantalla de "sin autorización"
 *
 * Se muestra cuando un usuario autenticado no tiene los roles necesarios
 * para acceder a una ruta protegida.
 */

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffeddb]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#354867] mb-2">
          Sin autorización
        </h2>
        <p className="text-gray-500">
          No tenés permisos para ver esta página.
        </p>
      </div>
    </div>
  );
}
