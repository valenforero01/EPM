import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Hash,
  CreditCard,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_MODE, useAppStore } from '../../store/useAppStore';
import { ClientLoginBannerSvg, EpmLogo } from '../../components/common/CustomIllustrations';

export const ClientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, clients, loginClient, addToast } = useAppStore();

  const [contract, setContract] = useState('');
  const [documentNum, setDocumentNum] = useState('');
  const [showDoc, setShowDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (session.role === 'client') {
      navigate('/clientes', { replace: true });
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

    const res = loginClient(contract, documentNum);
    if (!res.ok) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        setLockSeconds(30);
        setAttempts(0);
        setError('Superaste 3 intentos fallidos. Por seguridad debes esperar 30 segundos.');
      } else {
        setError(res.error || 'No fue posible validar tus datos.');
      }
      return;
    }

    addToast({
      type: 'success',
      title: 'Bienvenido a tu Portal Clientes EPM',
      description: 'Sesión iniciada correctamente.',
    });
    navigate('/clientes');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F5F8FA]">
      {/* Panel izquierdo ilustrado */}
      <div className="lg:col-span-6 bg-gradient-to-br from-[#00263D] via-[#003B5C] to-[#007A43] text-white p-8 sm:p-12 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <EpmLogo variant="light" compact />
        </div>

        <div className="my-8 space-y-6">
          <ClientLoginBannerSvg />
          <div className="space-y-2 max-w-md mx-auto lg:mx-0">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              Portal de Autogestión PQR 360
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Gestiona tus facturas y resuelve cobros en minutos
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Consulta tus últimos 6 periodos de consumo, radica peticiones con validación automática y descarga tu constancia oficial al instante.
            </p>
          </div>
          <ul className="space-y-2 text-xs text-slate-200 max-w-md mx-auto lg:mx-0">
            {[
              'Verificación de pagos por API en línea (STP)',
              'Lectura OCR de medidor y consulta remota AMI',
              'Control transparente del plazo legal de 15 días hábiles',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A859] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-slate-300">
          Prototipo académico – datos ficticios · Ley 142 de 1994
        </p>
      </div>

      {/* Panel derecho de ingreso */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8EE] shadow-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#003B5C]">Ingreso de Clientes</h2>
            <p className="text-xs text-slate-600 mt-1">
              Ingresa tu número de contrato (7 dígitos) y la cédula o documento del titular como contraseña.
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
                  <p className="font-mono font-bold mt-1">Reintento disponible en {lockSeconds}s</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="client-contract" className="block text-xs font-bold text-slate-700 mb-1.5">
                Número de contrato (7 dígitos)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="client-contract"
                  type="text"
                  required
                  value={contract}
                  disabled={lockSeconds > 0}
                  onChange={(e) => setContract(e.target.value)}
                  placeholder="Ej. 1045201"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-[#00A859] focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="client-doc" className="block text-xs font-bold text-slate-700 mb-1.5">
                Contraseña (Documento del titular)
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="client-doc"
                  type={showDoc ? 'text' : 'password'}
                  required
                  value={documentNum}
                  disabled={lockSeconds > 0}
                  onChange={(e) => setDocumentNum(e.target.value)}
                  placeholder="Número de documento"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:border-[#00A859] focus:outline-none disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowDoc(!showDoc)}
                  aria-label={showDoc ? 'Ocultar documento' : 'Mostrar documento'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showDoc ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={lockSeconds > 0}
              className="w-full py-3 rounded-xl bg-[#00A859] hover:bg-[#007A43] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors"
            >
              {lockSeconds > 0 ? `Bloqueado (${lockSeconds}s)` : 'Ingresar al Portal'}
            </button>
          </form>

          {DEMO_MODE && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#003B5C]">
                <Sparkles className="w-3.5 h-3.5 text-[#00A859]" />
                Selector rápido de prueba (60 clientes ficticios)
              </div>
              <select
                aria-label="Seleccionar cliente de demostración"
                defaultValue=""
                onChange={(e) => {
                  const chosen = clients.find((c) => c.id === e.target.value);
                  if (chosen) {
                    setContract(chosen.numeroContrato);
                    setDocumentNum(chosen.numeroDocumento);
                    setError(null);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              >
                <option value="" disabled>
                  Elige un cliente para autocompletar...
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numeroContrato} · {c.nombreCompleto} ({c.servicio} · {c.tipoMedidor})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
