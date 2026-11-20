import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  Mail,
  Eye,
  X,
  PlusCircle,
  CalendarClock,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PQRRequest } from '../../types';
import { formatCOP } from '../../utils/formatters';

export const ClientRequestsPage: React.FC = () => {
  const {
    session,
    clients,
    pqrRequests,
    setPrintablePqrId,
    sendEmailCopy,
    scheduleOrRescheduleVisit,
  } = useAppStore();

  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;
  const [selected, setSelected] = useState<PQRRequest | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitSlot, setNewVisitSlot] = useState<'Mañana 08:00–12:00' | 'Tarde 13:00–17:00'>('Tarde 13:00–17:00');

  useEffect(() => {
    if (!selected) return;
    const updated = pqrRequests.find((r) => r.id === selected.id);
    if (updated) setSelected(updated);
  }, [pqrRequests, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  if (!client) return null;

  const ownPqrs = pqrRequests.filter((p) => p.clientId === client.id);

  const handleSendMail = async (id: string) => {
    setSendingEmail(true);
    await sendEmailCopy(id);
    setSendingEmail(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#003B5C]">Mis Solicitudes PQR</h1>
          <p className="text-xs text-slate-500">
            Seguimiento en tiempo real de tus peticiones, quejas y recursos (Contrato {client.numeroContrato}).
          </p>
        </div>
        <Link
          to="/clientes/radicar"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Radicar nueva PQR
        </Link>
      </div>

      {ownPqrs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8EE] p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-600">
            No tienes solicitudes radicadas en este contrato.
          </p>
          <Link
            to="/clientes/radicar"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#003B5C] text-white text-xs font-bold"
          >
            Radicar primera solicitud
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ownPqrs.map((p) => {
            const pct = Math.min(100, Math.round((p.diasTranscurridosSLA / 15) * 100));
            const slaColor =
              p.diasTranscurridosSLA >= 13
                ? 'bg-[#C93C3C]'
                : p.diasTranscurridosSLA >= 8
                ? 'bg-[#F2A900]'
                : 'bg-[#00A859]';
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#E2E8EE] p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-[#003B5C]">{p.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#007A43] font-bold">
                      {p.estado}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{p.tipoInconformidad}</div>
                  <p className="text-slate-500">
                    Periodo: {p.mesReclamado} · Radicada: {p.fechaRadicacion} · Límite: {p.fechaLimite}
                  </p>
                  <div className="grid grid-cols-3 gap-2 bg-[#F5F8FA] rounded-xl p-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500">Reclamado</span>
                      <div className="font-mono font-bold tabular-nums">{formatCOP(p.valorReclamado)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Ajustado</span>
                      <div className="font-mono font-bold text-[#00A859] tabular-nums">{formatCOP(p.valorAjustado)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">A pagar</span>
                      <div className="font-mono font-bold text-[#003B5C] tabular-nums">{formatCOP(p.valorAPagar)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span>Control SLA (Ley 142)</span>
                      <span>Día {p.diasTranscurridosSLA} / 15</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${slaColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(p);
                      setNewVisitDate(p.resultadoMotorReglas.visitaAgendada?.fecha || '');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#003B5C] text-white text-xs font-bold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintablePqrId(p.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Constancia
                  </button>
                  {p.autorizaCopiaCorreo && (
                    <button
                      type="button"
                      onClick={() => handleSendMail(p.id)}
                      disabled={sendingEmail}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] text-white text-xs font-bold disabled:opacity-60"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Enviar copia a mi correo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle solicitud */}
      {selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-extrabold text-[#003B5C]">{selected.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#007A43] text-xs font-bold">
                    {selected.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selected.tipoInconformidad} · {selected.mesReclamado}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar detalle">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="rounded-xl bg-[#F5F8FA] border border-slate-200 p-4 space-y-1.5 text-xs">
              <div className="font-bold text-[#003B5C]">{selected.resultadoMotorReglas.decision}</div>
              <p className="text-slate-600 leading-relaxed">{selected.resultadoMotorReglas.justificacionTecnica}</p>
              <p className="text-slate-500">{selected.resultadoMotorReglas.justificacionLegal}</p>
            </div>

            {selected.resultadoMotorReglas.visitaAgendada && (
              <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 space-y-2 text-xs">
                <div className="font-bold text-[#003B5C] flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-sky-600" />
                  Visita Técnica ({selected.resultadoMotorReglas.visitaAgendada.estadoVisita})
                </div>
                <p>
                  Fecha: <strong>{selected.resultadoMotorReglas.visitaAgendada.fecha}</strong> · Franja:{' '}
                  <strong>{selected.resultadoMotorReglas.visitaAgendada.franja}</strong> · Cuadrilla:{' '}
                  {selected.resultadoMotorReglas.visitaAgendada.cuadrilla}
                </p>
                {selected.resultadoMotorReglas.visitaAgendada.estadoVisita !== 'Realizada' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newVisitDate}
                      onChange={(e) => setNewVisitDate(e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <select
                      value={newVisitSlot}
                      onChange={(e) =>
                        setNewVisitSlot(e.target.value as 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00')
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Mañana 08:00–12:00">Mañana 08:00–12:00</option>
                      <option value="Tarde 13:00–17:00">Tarde 13:00–17:00</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        scheduleOrRescheduleVisit(
                          selected.id,
                          newVisitDate || selected.resultadoMotorReglas.visitaAgendada!.fecha,
                          newVisitSlot,
                          selected.resultadoMotorReglas.visitaAgendada!.cuadrilla,
                          client.nombreCompleto
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#003B5C] text-white font-bold"
                    >
                      Reprogramar cita
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mensajes de EPM */}
            {selected.mensajesCliente.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-[#003B5C]">Comunicaciones de EPM</div>
                {selected.mensajesCliente.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="font-bold text-[#007A43]">
                      {m.autor} · <span className="font-normal text-slate-500">{m.fecha}</span>
                    </div>
                    <p className="mt-1 text-slate-700">{m.texto}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Línea de tiempo */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#003B5C]">Línea de Tiempo</div>
              <div className="space-y-2 border-l-2 border-[#00A859] pl-3">
                {selected.historialEventos.map((ev) => (
                  <div key={ev.id}>
                    <div className="font-bold">
                      {ev.titulo} <span className="font-mono font-normal text-slate-400">· {ev.fecha}</span>
                    </div>
                    <p className="text-slate-600">{ev.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPrintablePqrId(selected.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003B5C] text-white text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                Descargar constancia
              </button>

              {selected.autorizaCopiaCorreo ? (
                <button
                  type="button"
                  onClick={() => handleSendMail(selected.id)}
                  disabled={sendingEmail}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] text-white text-xs font-bold"
                >
                  <Mail className="w-4 h-4" />
                  {sendingEmail ? 'Enviando...' : 'Enviar copia a mi correo'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  No autorizaste el envío de copia al correo
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
