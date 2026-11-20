import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Receipt, FileText, PlusCircle, Bell, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';

export const ClientHomePage: React.FC = () => {
  const { session, clients, invoices, pqrRequests, clientNotifications } = useAppStore();
  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;

  if (!client) return null;

  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const latestInvoice = clientInvoices[clientInvoices.length - 1];
  const ownPqrs = pqrRequests.filter((p) => p.clientId === client.id);
  const activePqrs = ownPqrs.filter((p) => !['Procedente', 'No procedente', 'Cerrada'].includes(p.estado));
  const recentNotifs = clientNotifications.filter((n) => n.clientId === client.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Saludo y resumen del contrato */}
      <div className="bg-gradient-to-r from-[#003B5C] to-[#007A43] text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Resumen de Contrato {client.numeroContrato}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hola, {client.nombreCompleto}</h1>
          <p className="text-xs sm:text-sm text-slate-200">
            {client.direccion}, {client.barrio}, {client.municipio} · Estrato {client.estrato} · Servicio: <strong>{client.servicio}</strong> ({client.tipoMedidor})
          </p>
        </div>

        <Link
          to="/clientes/radicar"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#003B5C] hover:bg-emerald-50 font-bold text-sm shadow-sm shrink-0 self-start md:self-center"
        >
          <PlusCircle className="w-4 h-4 text-[#00A859]" />
          Radicar nueva PQR
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Última factura */}
        <div className="bg-white rounded-2xl border border-[#E2E8EE] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#00A859]" />
                Última Factura
              </span>
              {latestInvoice && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    latestInvoice.estado === 'Pagada'
                      ? 'bg-emerald-100 text-[#007A43]'
                      : latestInvoice.estado === 'Pendiente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-[#C93C3C]'
                  }`}
                >
                  {latestInvoice.estado}
                </span>
              )}
            </div>
            {latestInvoice ? (
              <>
                <div className="text-2xl font-extrabold font-mono text-[#003B5C] tabular-nums">
                  {formatCOP(latestInvoice.valorTotal)}
                </div>
                <p className="text-xs text-slate-600">
                  Periodo: <strong>{latestInvoice.mes}</strong> · Consumo: {latestInvoice.consumo} {latestInvoice.unidad}
                </p>
                <p className="text-xs text-slate-500">
                  Vencimiento: {latestInvoice.fechaVencimiento} · Corte: {latestInvoice.fechaCorte}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Sin facturas registradas.</p>
            )}
          </div>

          <Link
            to="/clientes/facturas"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A859] hover:text-[#007A43]"
          >
            Ver histórico completo de facturas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* PQRs en curso */}
        <div className="bg-white rounded-2xl border border-[#E2E8EE] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#003B5C]" />
                Solicitudes en Curso ({activePqrs.length})
              </span>
              <span className="text-xs font-mono text-slate-400">Total: {ownPqrs.length}</span>
            </div>

            {ownPqrs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No tienes solicitudes radicadas todavía.
              </p>
            ) : (
              <div className="space-y-2.5">
                {ownPqrs.slice(0, 2).map((p) => {
                  const pct = Math.min(100, Math.round((p.diasTranscurridosSLA / 15) * 100));
                  return (
                    <div key={p.id} className="p-3 rounded-xl bg-[#F5F8FA] border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#003B5C]">{p.id}</span>
                        <span className="font-bold text-[#007A43]">{p.estado}</span>
                      </div>
                      <div className="text-slate-600 truncate">{p.tipoInconformidad}</div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A859]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/clientes/solicitudes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A859] hover:text-[#007A43]"
          >
            Ir a Mis solicitudes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mensajes y notificaciones */}
        <div className="bg-white rounded-2xl border border-[#E2E8EE] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              Notificaciones de EPM
            </span>
            {recentNotifs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Sin notificaciones recientes.</p>
            ) : (
              <div className="space-y-2">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                    <div className="font-bold text-[#003B5C]">{n.titulo}</div>
                    <p className="text-slate-600 line-clamp-2">{n.mensaje}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/clientes/notificaciones"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A859] hover:text-[#007A43]"
          >
            Ver todas las notificaciones
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Aviso garantías Ley 142 */}
      <div className="bg-white rounded-2xl border border-[#E2E8EE] p-4 flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-[#00A859] shrink-0" />
        <p>
          Recuerda que toda PQR cuenta con un plazo máximo de respuesta de <strong>15 días hábiles</strong> (Ley 142 de 1994). Si tu solicitud aplica para resolución automática STP, recibirás tu nota crédito en minutos.
        </p>
      </div>
    </div>
  );
};
