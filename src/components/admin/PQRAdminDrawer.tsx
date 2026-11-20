import React, { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Printer,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Wifi,
  AlertTriangle,
  Send,
  Lock,
  MessageSquarePlus,
  UserCheck,
} from 'lucide-react';
import { PQRRequest, PQRStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP, getNextBusinessDateCO } from '../../utils/formatters';

interface PQRAdminDrawerProps {
  pqrId: string | null;
  onClose: () => void;
}

const ALL_STATUSES: PQRStatus[] = [
  'Radicada',
  'En validación',
  'En validación AMI',
  'Visita técnica',
  'Análisis',
  'Pendiente de aprobación',
  'Procedente',
  'No procedente',
  'Cerrada',
];

export const PQRAdminDrawer: React.FC<PQRAdminDrawerProps> = ({ pqrId, onClose }) => {
  const {
    pqrRequests,
    clients,
    updatePQRStatus,
    assignPQRResponsible,
    scheduleOrRescheduleVisit,
    approveOrRejectAdjustment,
    prioritizePQR,
    queryAMIRemote,
    addInternalNote,
    sendClientResponse,
    closePQR,
    sendEmailCopy,
    setPrintablePqrId,
  } = useAppStore();

  const pqr: PQRRequest | undefined = pqrRequests.find((r) => r.id === pqrId);
  const client = clients.find((c) => c.id === pqr?.clientId);

  const [noteText, setNoteText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [visitDate, setVisitDate] = useState(getNextBusinessDateCO(2));
  const [visitSlot, setVisitSlot] = useState<'Mañana 08:00–12:00' | 'Tarde 13:00–17:00'>('Mañana 08:00–12:00');
  const [visitCrew, setVisitCrew] = useState('Cuadrilla Valle Aburrá 01');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!pqrId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pqrId, onClose]);

  if (!pqr) return null;

  const handleSendMail = async () => {
    setSendingEmail(true);
    await sendEmailCopy(pqr.id);
    setSendingEmail(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de solicitud ${pqr.id}`}
      className="no-print fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header del Drawer */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg font-extrabold text-[#003B5C] dark:text-white">
                {pqr.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#007A43]">
                {pqr.estado}
              </span>
              {pqr.priorizada && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-[#C93C3C]">
                  Priorizada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Radicada: {pqr.fechaRadicacion} · Límite legal: {pqr.fechaLimite} · SLA: {pqr.diasTranscurridosSLA}/15 días hábiles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSendMail}
              disabled={sendingEmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] text-white text-xs font-bold disabled:opacity-60"
            >
              <Mail className="w-3.5 h-3.5" />
              {sendingEmail ? 'Enviando...' : 'Enviar copia al correo'}
            </button>
            <button
              type="button"
              onClick={() => setPrintablePqrId(pqr.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Printer className="w-3.5 h-3.5" />
              Constancia
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de detalle"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Datos titular y liquidación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-1.5 text-xs">
              <div className="font-bold uppercase text-slate-500 dark:text-slate-400">Titular y Contrato</div>
              <p className="text-sm font-bold text-[#003B5C] dark:text-white">{pqr.nombreCliente}</p>
              <p>{pqr.tipoDocumento} {pqr.numeroDocumento} · Contrato <strong className="font-mono">{pqr.contrato}</strong></p>
              <p>Servicio: {pqr.servicio} · Medidor: {client?.tipoMedidor || 'Convencional'}</p>
              <p>Ubicación: {client?.direccion}, {client?.barrio}, {client?.municipio} (Estrato {client?.estrato})</p>
              <p>Contacto ({pqr.canalContacto}): {pqr.datoContacto} · {pqr.correoCliente}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-xs">
              <div className="font-bold uppercase text-slate-500 dark:text-slate-400">Resumen Económico</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Facturado:</span>
                  <div className="font-mono font-bold text-sm tabular-nums">{formatCOP(pqr.valorFacturado)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Reclamado:</span>
                  <div className="font-mono font-bold text-sm text-amber-600 tabular-nums">{formatCOP(pqr.valorReclamado)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Ajustado:</span>
                  <div className="font-mono font-bold text-sm text-[#00A859] tabular-nums">{formatCOP(pqr.valorAjustado)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Valor a pagar:</span>
                  <div className="font-mono font-bold text-sm text-[#003B5C] dark:text-sky-300 tabular-nums">{formatCOP(pqr.valorAPagar)}</div>
                </div>
              </div>
              <p className="pt-1 text-slate-600 dark:text-slate-300">
                <strong>Motivo:</strong> {pqr.tipoInconformidad} ({pqr.mesReclamado})
              </p>
            </div>
          </div>

          {/* Decisión BRMS y hechos */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-500">Motor de Reglas BRMS ({pqr.resultadoMotorReglas.reglaAplicada})</div>
            <div className="text-sm font-bold text-[#003B5C] dark:text-emerald-300">{pqr.resultadoMotorReglas.decision}</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{pqr.resultadoMotorReglas.justificacionTecnica}</p>
            <p className="text-xs text-slate-500 italic">Relato del cliente: “{pqr.descripcionHechos}”</p>
          </div>

          {/* Soportes OCR / Comprobantes */}
          {(pqr.comprobantePagoUrl || pqr.fotoMedidorUrl) && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-500">Soportes Adjuntos y OCR</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pqr.comprobantePagoUrl && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
                    <div className="text-[11px] font-semibold mb-1.5">Comprobante de pago ({pqr.referenciaComprobante || 'OCR'})</div>
                    <img src={pqr.comprobantePagoUrl} alt="Comprobante de pago adjunto" className="w-full rounded-lg" />
                  </div>
                )}
                {pqr.fotoMedidorUrl && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
                    <div className="text-[11px] font-semibold mb-1.5">Foto de medidor ({pqr.lecturaReportada ?? 'N/A'})</div>
                    <img src={pqr.fotoMedidorUrl} alt="Foto del medidor adjunta" className="w-full rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Panel de acciones administrativas */}
          <div className="rounded-2xl bg-[#F5F8FA] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <h3 className="text-sm font-bold text-[#003B5C] dark:text-white">Acciones de Gestión</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Cambiar estado manual
                </label>
                <select
                  value={pqr.estado}
                  onChange={(e) => updatePQRStatus(pqr.id, e.target.value as PQRStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Asignar responsable
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={pqr.responsable}
                    onChange={(e) =>
                      assignPQRResponsible(
                        pqr.id,
                        e.target.value as PQRRequest['responsable'],
                        e.target.value === 'Analista PQR' ? 'Laura Restrepo (Analista)' : undefined
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                  >
                    <option value="Automático STP">Automático STP</option>
                    <option value="Analista PQR">Analista PQR</option>
                    <option value="Cuadrilla Técnica">Cuadrilla Técnica</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => prioritizePQR(pqr.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Priorizar
                  </button>
                </div>
              </div>
            </div>

            {/* Telemetría AMI y Resolución */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => queryAMIRemote(pqr.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
              >
                <Wifi className="w-3.5 h-3.5" />
                Consultar AMI remota y resolver
              </button>
              <button
                type="button"
                onClick={() =>
                  closePQR(pqr.id, 'Caso verificado y cerrado definitivamente por consola administrativa.')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold"
              >
                <Lock className="w-3.5 h-3.5" />
                Cerrar caso
              </button>
            </div>

            {/* Aprobar o rechazar ajuste con motivo */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Aprobar o rechazar ajuste económico
              </label>
              <input
                type="text"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Motivo técnico o jurídico de aprobación/rechazo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    approveOrRejectAdjustment(
                      pqr.id,
                      true,
                      decisionReason.trim() || 'Ajuste aprobado tras verificación documental y tarifaria.'
                    );
                    setDecisionReason('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprobar ajuste ({formatCOP(pqr.valorReclamado)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    approveOrRejectAdjustment(
                      pqr.id,
                      false,
                      decisionReason.trim() || 'Cobro ratificado conforme a la medición y tarifa vigente.'
                    );
                    setDecisionReason('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C93C3C] hover:bg-rose-700 text-white text-xs font-bold"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rechazar ajuste
                </button>
              </div>
            </div>

            {/* Programar / Reprogramar visita técnica */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Programar o reprogramar visita técnica
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
                <select
                  value={visitSlot}
                  onChange={(e) =>
                    setVisitSlot(e.target.value as 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00')
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                >
                  <option value="Mañana 08:00–12:00">Mañana 08:00–12:00</option>
                  <option value="Tarde 13:00–17:00">Tarde 13:00–17:00</option>
                </select>
                <input
                  type="text"
                  value={visitCrew}
                  onChange={(e) => setVisitCrew(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => scheduleOrRescheduleVisit(pqr.id, visitDate, visitSlot, visitCrew)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003B5C] hover:bg-[#00263D] text-white text-xs font-bold"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                {pqr.resultadoMotorReglas.visitaAgendada ? 'Reprogramar visita' : 'Programar visita'}
              </button>
            </div>
          </div>

          {/* Responder al cliente y notas internas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#003B5C] dark:text-white">
                <UserCheck className="w-4 h-4 text-[#00A859]" />
                Mensajes al Cliente ({pqr.mensajesCliente.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
                {pqr.mensajesCliente.length === 0 ? (
                  <p className="text-slate-400">Sin mensajes enviados al cliente.</p>
                ) : (
                  pqr.mensajesCliente.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div className="font-bold text-[#003B5C] dark:text-emerald-300">
                        {m.autor} · <span className="font-normal text-slate-400">{m.fecha}</span>
                      </div>
                      <p className="mt-0.5">{m.texto}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Responder al cliente..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    sendClientResponse(pqr.id, replyText);
                    setReplyText('');
                  }}
                  aria-label="Enviar respuesta al cliente"
                  className="px-3 py-2 rounded-xl bg-[#00A859] text-white text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#003B5C] dark:text-white">
                <MessageSquarePlus className="w-4 h-4 text-amber-500" />
                Notas Internas ({pqr.notasInternas.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
                {pqr.notasInternas.length === 0 ? (
                  <p className="text-slate-400">Sin notas internas registradas.</p>
                ) : (
                  pqr.notasInternas.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        {n.autor} · <span className="font-normal">{n.fecha}</span>
                      </div>
                      <p className="mt-0.5">{n.texto}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Agregar nota interna..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    addInternalNote(pqr.id, noteText);
                    setNoteText('');
                  }}
                  className="px-3 py-2 rounded-xl bg-[#003B5C] text-white text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Línea de tiempo */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500">Historial de Trazabilidad</h3>
            <div className="space-y-2.5 border-l-2 border-[#00A859] pl-4">
              {pqr.historialEventos.map((ev) => (
                <div key={ev.id} className="text-xs">
                  <div className="font-bold text-[#003B5C] dark:text-white">
                    {ev.titulo} <span className="font-mono font-normal text-slate-400">· {ev.fecha}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{ev.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
