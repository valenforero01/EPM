import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Receipt,
  Truck,
  Sliders,
  BarChart3,
  Bell,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EpmLogo } from '../common/CustomIllustrations';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/solicitudes', label: 'Solicitudes PQR', icon: FileSpreadsheet },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/facturacion', label: 'Facturación y recaudo', icon: Receipt },
  { to: '/admin/visitas', label: 'Visitas técnicas', icon: Truck },
  { to: '/admin/reglas', label: 'Reglas e integración', icon: Sliders },
  { to: '/admin/reportes', label: 'Reportes y auditoría', icon: BarChart3 },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    adminDarkMode,
    toggleAdminDarkMode,
    pqrRequests,
    ruleConfig,
    logout,
    addToast,
  } = useAppStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const activeAlerts = pqrRequests.filter(
    (r) =>
      r.estado !== 'Procedente' &&
      r.estado !== 'No procedente' &&
      r.estado !== 'Cerrada' &&
      r.diasTranscurridosSLA >= ruleConfig.diaAlertaTemprana
  );

  const currentNav = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout('Cierre de sesión desde barra administrativa.');
    addToast({ type: 'info', title: 'Sesión administrativa cerrada' });
    navigate('/admin/login');
  };

  return (
    <div className={adminDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F5F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
        {/* Sidebar Desktop */}
        <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col bg-[#00263D] dark:bg-slate-900 text-slate-100 border-r border-white/10 shrink-0">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link to="/admin" aria-label="Consola EPM PQR 360">
              <EpmLogo variant="light" compact />
            </Link>
            <span className="text-[11px] font-mono font-semibold text-emerald-300">PQR 360</span>
          </div>

          <nav aria-label="Menú consola administrativa" className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#00A859] text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-3">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
            >
              <span>Ver sitio institucional</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="text-[11px] text-slate-400">
              ADMINISTRADOR · Rol: administrador
            </div>
          </div>
        </aside>

        {/* Sidebar Móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative w-68 max-w-[82vw] bg-[#00263D] text-white flex flex-col z-10">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <EpmLogo variant="light" compact />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar menú lateral"
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                          isActive ? 'bg-[#00A859] text-white' : 'text-slate-300 hover:bg-white/10'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Área principal */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="no-print sticky top-[30px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2E8EE] dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú lateral"
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-[#003B5C] dark:text-white leading-tight">
                  {currentNav?.label || 'Consola Administrativa'}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ADMINISTRADOR · Rol: administrador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Campana de alertas SLA */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBellOpen(!bellOpen)}
                  aria-label="Alertas tempranas SLA"
                  className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Bell className="w-4 h-4 text-[#003B5C] dark:text-slate-200" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C93C3C] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50 space-y-2">
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-[#003B5C] dark:text-white">
                        Alertas SLA (Día {ruleConfig.diaAlertaTemprana}+)
                      </span>
                      <span className="text-[11px] font-mono text-rose-600 font-bold">
                        {activeAlerts.length} activas
                      </span>
                    </div>
                    {activeAlerts.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">Sin alertas SLA pendientes.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {activeAlerts.slice(0, 6).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setBellOpen(false);
                              navigate('/admin/solicitudes');
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2"
                          >
                            <AlertTriangle
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                a.diasTranscurridosSLA >= ruleConfig.diaDictamenPreventivo
                                  ? 'text-[#C93C3C]'
                                  : 'text-[#F2A900]'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-mono font-bold text-[#003B5C] dark:text-white">
                                {a.id} · Día {a.diasTranscurridosSLA}/15
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">{a.nombreCliente}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modo claro / oscuro */}
              <button
                type="button"
                onClick={toggleAdminDarkMode}
                aria-label={adminDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {adminDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#003B5C]" />
                )}
              </button>

              {/* Cerrar sesión */}
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#C93C3C] dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </header>

          {/* Contenido de la ruta hija */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>

        {/* Modal confirmación cierre sesión */}
        {logoutModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-logout-title"
            className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h2 id="admin-logout-title" className="text-lg font-bold text-[#003B5C] dark:text-white">
                ¿Cerrar sesión administrativa?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Los cambios realizados en solicitudes, visitas y reglas permanecen guardados localmente.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="px-4 py-2 rounded-xl bg-[#C93C3C] hover:bg-rose-700 text-white text-sm font-bold"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
