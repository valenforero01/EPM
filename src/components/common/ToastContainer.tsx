import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-5 left-5 z-[70] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((t) => {
        const styles =
          t.type === 'success'
            ? 'bg-emerald-950 text-white border-emerald-500/40'
            : t.type === 'error'
            ? 'bg-rose-950 text-white border-rose-500/40'
            : t.type === 'warning'
            ? 'bg-amber-950 text-white border-amber-400/40'
            : 'bg-[#003B5C] text-white border-sky-400/30';

        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
            ? XCircle
            : t.type === 'warning'
            ? AlertTriangle
            : Info;

        return (
          <div
            key={t.id}
            role="status"
            className={`rounded-2xl border px-4 py-3 shadow-xl flex items-start gap-3 ${styles}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5 text-[#00A859]" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Cerrar notificación"
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
