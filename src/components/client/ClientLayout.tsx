import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Receipt,
  FileText,
  PlusCircle,
  Bell,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EpmLogo } from '../common/CustomIllustrations';
import { ChatbotEpi } from '../common/ChatbotEpi';

export const ClientLayout: React.FC = () => {
  const navigate = useNavigate();
  const { session, clients, clientNotifications, logout, addToast } = useAppStore();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;
  const unreadCount = client
    ? clientNotifications.filter((n) => n.clientId === client.id && !n.leida).length
    : 0;

  const navItems = [
    { to: '/clientes', label: 'Inicio', icon: Home, end: true },
    { to: '/clientes/facturas', label: 'Mis facturas', icon: Receipt },
    { to: '/clientes/solicitudes', label: 'Mis solicitudes', icon: FileText },
    { to: '/clientes/radicar', label: 'Radicar PQR', icon: PlusCircle },
    { to: '/clientes/notificaciones', label: 'Notificaciones', icon: Bell, badge: unreadCount },
  ];

  const handleLogout = () => {
    setLogoutOpen(false);
    logout('Cierre de sesión desde Portal Clientes.');
    addToast({ type: 'info', title: 'Sesión cerrada correctamente' });
    navigate('/clientes/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FA]">
      <header className="no-print sticky top-[30px] z-30 bg-white border-b border-[#E2E8EE] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link to="/clientes" aria-label="Inicio Portal Clientes EPM">
              <EpmLogo compact />
            </Link>
            {client && (
              <div className="text-xs border-l border-slate-200 pl-3">
                <div className="font-bold text-[#003B5C]">{client.nombreCompleto}</div>
                <div className="text-slate-500 font-mono">
                  Contrato {client.numeroContrato} · {client.servicio}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sitio EPM
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-[#C93C3C] border border-rose-200 text-xs font-bold hover:bg-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Barra de pestañas */}
        <nav aria-label="Menú Portal Clientes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#003B5C] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#003B5C]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#00A859] text-white text-[10px] font-mono">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <ChatbotEpi />

      {logoutOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold text-[#003B5C]">¿Cerrar tu sesión?</h2>
            <p className="text-xs text-slate-600">
              Tus solicitudes y facturas permanecerán disponibles cuando vuelvas a ingresar con tu contrato.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-[#C93C3C] text-white text-xs font-bold"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
