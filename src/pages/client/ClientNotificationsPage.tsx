import React from 'react';
import { Bell, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ClientNotificationsPage: React.FC = () => {
  const { session, clients, clientNotifications, markNotificationRead } = useAppStore();
  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;

  if (!client) return null;

  const list = clientNotifications.filter((n) => n.clientId === client.id);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-[#003B5C] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00A859]" />
          Notificaciones y Respuestas de EPM
        </h1>
        <p className="text-xs text-slate-500">
          Avisos automáticos sobre resoluciones STP, visitas técnicas y respuestas de analistas.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8EE] p-10 text-center text-sm text-slate-500">
          No tienes notificaciones pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.leida ? 'bg-white border-[#E2E8EE]' : 'bg-emerald-50/70 border-emerald-200 shadow-xs'
              }`}
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  {!n.leida && <span className="w-2 h-2 rounded-full bg-[#00A859]" />}
                  <span className="font-bold text-sm text-[#003B5C]">{n.titulo}</span>
                  <span className="font-mono text-[11px] text-slate-400">· {n.fecha}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{n.mensaje}</p>
              </div>
              {!n.leida && (
                <button
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-[#007A43] text-xs font-bold shrink-0 self-start sm:self-center"
                >
                  <Check className="w-3.5 h-3.5" />
                  Marcar leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
