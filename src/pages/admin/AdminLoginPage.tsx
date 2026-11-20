import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { DEMO_MODE, useAppStore } from '../../store/useAppStore';
import { EpmLogo } from '../../components/common/CustomIllustrations';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, loginAdmin, addToast } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (session.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [session.role, navigate]);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = window.setInterval(() => {
      setLockSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [lockSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSeconds > 0) return;
    setError(null);

    const res = loginAdmin(username, password);
    if (!res.ok) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setLockSeconds(30);
        setAttempts(0);
        setError('Superaste 3 intentos fallidos. Acceso bloqueado temporalmente durante 30 segundos.');
      } else {
        setError(res.error || 'Credenciales inválidas.');
      }
      return;
    }

    addToast({
      type: 'success',
      title: 'Bienvenido a Consola Trabajadores EPM',
      description: 'Sesión iniciada como ADMINISTRADOR.',
    });
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B2C] via-[#00263D] to-[#003B5C] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al sitio institucional
          </Link>
          <EpmLogo variant="light" compact />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00A859]">
              <ShieldCheck className="w-4 h-4" />
              Consola Interna de Operación
            </div>
            <h1 className="text-2xl font-extrabold text-[#003B5C]">
              Ingreso Trabajadores EPM
            </h1>
            <p className="text-xs text-slate-600">
              Acceso exclusivo para gestión administrativa, control de SLA y motor de reglas BRMS PQR 360.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-[#C93C3C] shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {lockSeconds > 0 && (
                  <p className="font-mono font-bold mt-1">
                    Reintento disponible en {lockSeconds}s
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-user" className="block text-xs font-bold text-slate-700 mb-1.5">
                Usuario corporativo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-user"
                  type="text"
                  required
                  value={username}
                  disabled={lockSeconds > 0}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ADMINISTRADOR"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#00A859] focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-xs font-bold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-pass"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  disabled={lockSeconds > 0}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#00A859] focus:outline-none disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={lockSeconds > 0}
              className="w-full py-3 rounded-xl bg-[#003B5C] hover:bg-[#00263D] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors"
            >
              {lockSeconds > 0 ? `Bloqueado (${lockSeconds}s)` : 'Ingresar a Consola'}
            </button>
          </form>

          {DEMO_MODE && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003B5C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#00A859]" />
                  Modo Demostración Académica
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('ADMINISTRADOR');
                    setPassword('823027');
                    setError(null);
                  }}
                  className="text-xs font-bold text-[#00A859] hover:text-[#007A43] underline"
                >
                  Autocompletar credenciales
                </button>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Usuario: <strong>ADMINISTRADOR</strong> · Clave: <strong>823027</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
