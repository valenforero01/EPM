import React, { useEffect, useState } from 'react';
import { Printer, X, Mail, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';
import { EpmLogo } from './CustomIllustrations';

export const PrintableConstanciaModal: React.FC = () => {
  const { printablePqrId, setPrintablePqrId, pqrRequests, sendEmailCopy } = useAppStore();
  const [sending, setSending] = useState(false);

  const pqr = pqrRequests.find((r) => r.id === printablePqrId);

  useEffect(() => {
    if (!printablePqrId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrintablePqrId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [printablePqrId, setPrintablePqrId]);

  if (!pqr) return null;

  const handleSendEmail = async () => {
    setSending(true);
    await sendEmailCopy(pqr.id);
    setSending(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="constancia-title"
      className="fixed inset-0 z-[75] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Barra superior de acciones (no se imprime) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00A859]" />
            <span id="constancia-title" className="font-bold text-[#003B5C] text-sm sm:text-base">
              Constancia de Solicitud {pqr.id}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pqr.autorizaCopiaCorreo ? (
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" />
                {sending ? 'Enviando copia...' : 'Enviar copia a mi correo'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-200/70 px-3 py-1.5 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                No autorizaste el envío de copia al correo
              </span>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003B5C] hover:bg-[#00263D] text-white text-xs sm:text-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={() => setPrintablePqrId(null)}
              aria-label="Cerrar constancia"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Documento formal imprimible */}
        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#00A859] pb-5">
            <div>
              <EpmLogo />
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Proceso TO-BE PQR 360 · Gestión de Cobros Improcedentes
              </p>
              <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 inline-block mt-1">
                Prototipo académico – sin validez legal
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Radicado Oficial</div>
              <div className="font-mono text-xl font-bold text-[#003B5C]">{pqr.id}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Fecha radicación: <strong>{pqr.fechaRadicacion}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Fecha límite legal: <strong>{pqr.fechaLimite}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">Titular y Contrato</div>
              <p className="font-bold text-slate-900">{pqr.nombreCliente}</p>
              <p className="text-slate-700">
                Documento: {pqr.tipoDocumento} {pqr.numeroDocumento}
              </p>
              <p className="text-slate-700">
                Contrato: <span className="font-mono font-semibold">{pqr.contrato}</span> · Servicio: {pqr.servicio}
              </p>
              <p className="text-slate-700">Correo: {pqr.correoCliente}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-500">Detalle de la Reclamación</div>
              <p className="font-bold text-[#003B5C]">{pqr.tipoInconformidad}</p>
              <p className="text-slate-700">Periodo reclamado: {pqr.mesReclamado}</p>
              <p className="text-slate-700">Canal: {pqr.canalRadicacion}</p>
              <p className="text-slate-700">
                Estado actual: <strong className="text-[#007A43]">{pqr.estado}</strong>
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-[#003B5C] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
              Liquidación y Dictamen del Motor de Reglas (BRMS)
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Valor Facturado</div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">{formatCOP(pqr.valorFacturado)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Valor Reclamado</div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">{formatCOP(pqr.valorReclamado)}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700">Ajuste / Nota Crédito</div>
                  <div className="font-mono font-bold text-[#007A43] tabular-nums">{formatCOP(pqr.valorAjustado)}</div>
                </div>
                <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                  <div className="text-[11px] text-[#003B5C]">Valor a Pagar</div>
                  <div className="font-mono font-bold text-[#003B5C] tabular-nums">{formatCOP(pqr.valorAPagar)}</div>
                </div>
              </div>

              <div className="text-sm space-y-1 pt-2">
                <p className="font-bold text-[#003B5C]">{pqr.resultadoMotorReglas.decision}</p>
                <p className="text-xs text-slate-500">Regla aplicada: {pqr.resultadoMotorReglas.reglaAplicada}</p>
                <p className="text-slate-700 leading-relaxed">{pqr.resultadoMotorReglas.justificacionTecnica}</p>
                {pqr.resultadoMotorReglas.notaCreditoGenerada && (
                  <p className="text-xs font-mono font-semibold text-[#007A43]">
                    Nota Crédito generada: {pqr.resultadoMotorReglas.notaCreditoGenerada}
                    {pqr.resultadoMotorReglas.ordenCorteCancelada ? ' · Orden de suspensión/corte cancelada' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
              <strong>Marco legal Ley 142 de 1994 (Art. 158):</strong> Las empresas de servicios públicos domiciliarios disponen de un término máximo de quince (15) días hábiles contados a partir de la fecha de presentación de la petición, queja o recurso para responder. De no producirse respuesta oportuna opera el silencio administrativo positivo. Documento generado por prototipo académico – datos ficticios – sin validez legal.
            </div>
            {/* Código QR SVG simulado de verificación */}
            <div className="shrink-0 flex flex-col items-center">
              <svg width="72" height="72" viewBox="0 0 36 36" className="border border-slate-300 p-1 rounded-lg bg-white" aria-label="Código QR de verificación">
                <rect x="2" y="2" width="10" height="10" fill="#003B5C" />
                <rect x="4" y="4" width="6" height="6" fill="#fff" />
                <rect x="5" y="5" width="4" height="4" fill="#003B5C" />
                <rect x="24" y="2" width="10" height="10" fill="#003B5C" />
                <rect x="26" y="4" width="6" height="6" fill="#fff" />
                <rect x="27" y="5" width="4" height="4" fill="#003B5C" />
                <rect x="2" y="24" width="10" height="10" fill="#003B5C" />
                <rect x="4" y="26" width="6" height="6" fill="#fff" />
                <rect x="5" y="27" width="4" height="4" fill="#003B5C" />
                <rect x="15" y="5" width="4" height="4" fill="#00A859" />
                <rect x="15" y="13" width="6" height="6" fill="#003B5C" />
                <rect x="24" y="16" width="4" height="8" fill="#003B5C" />
                <rect x="15" y="24" width="8" height="4" fill="#00A859" />
                <rect x="27" y="27" width="6" height="6" fill="#003B5C" />
              </svg>
              <span className="text-[10px] font-mono text-slate-500 mt-1">{pqr.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
