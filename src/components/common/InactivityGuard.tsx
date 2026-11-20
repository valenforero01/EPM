import React, { useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const WARNING_MS = 9 * 60 * 1000; // 9 minutos
const LOGOUT_MS = 10 * 60 * 1000; // 10 minutos

export const InactivityGuard: React.FC = () => {
  const {
    session,
    lastActivityAt,
    inactivityWarningOpen,
    touchActivity,
    setInactivityWarningOpen,
    logout,
    addToast,
  } = useAppStore();

  useEffect(() => {
    if (session.role === 'guest') return;

    const events: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (!inactivityWarningOpen) {
        touchActivity();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - useAppStore.getState().lastActivityAt;
      if (elapsed >= LOGOUT_MS) {
        setInactivityWarningOpen(false);
        logout('Cierre automático por 10 minutos de inactividad.');
        addToast({
          type: 'warning',
          title: 'Sesión cerrada por inactividad',
          description: 'Por seguridad cerramos tu sesión tras 10 minutos sin actividad.',
        });
      } else if (elapsed >= WARNING_MS && !useAppStore.getState().inactivityWarningOpen) {
        setInactivityWarningOpen(true);
      }
    }, 5000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      window.clearInterval(interval);
    };
  }, [session.role, inactivityWarningOpen, touchActivity, setInactivityWarningOpen, logout, addToast]);

  useEffect(() => {
    if (!inactivityWarningOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        touchActivity();
        setInactivityWarningOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inactivityWarningOpen, touchActivity, setInactivityWarningOpen]);

  if (!inactivityWarningOpen || session.role === 'guest') return null;

  const remainingSec = Math.max(0, Math.ceil((LOGOUT_MS - (Date.now() - lastActivityAt)) / 1000));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      className="no-print fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="inactivity-title" className="text-lg font-bold text-[#003B5C] dark:text-white">
              Tu sesión está por expirar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Se cerrará automáticamente en aproximadamente {remainingSec} segundos.
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
          Detectamos 9 minutos de inactividad. Para proteger tus datos y solicitudes, confirma si deseas continuar conectado.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => logout('Sesión cerrada desde aviso de inactividad.')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              touchActivity();
              setInactivityWarningOpen(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-sm font-semibold shadow-sm"
          >
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  );
};
