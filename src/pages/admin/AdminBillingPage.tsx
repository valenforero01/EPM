import React, { useMemo, useState } from 'react';
import { AlertTriangle, PlusCircle, Search } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';

export const AdminBillingPage: React.FC = () => {
  const { invoices, clients, pqrRequests, createExOfficioPQR } = useAppStore();

  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [page, setPage] = useState(1);

  const clientMap = useMemo(() => {
    const m = new Map(clients.map((c) => [c.id, c]));
    return m;
  }, [clients]);

  // Detectar cobros sospechosos sin PQR radicada
  const suspiciousInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const hasExtraAfterPaid = inv.estado === 'Pagada' && inv.cobrosAdicionales.length > 0;
      const hasObservation = Boolean(inv.observacionesCobro);
      if (!hasExtraAfterPaid && !hasObservation) return false;
      const alreadyHasPqr = pqrRequests.some(
        (p) => p.clientId === inv.clientId && p.mesReclamado === inv.mes
      );
      return !alreadyHasPqr;
    });
  }, [invoices, pqrRequests]);

  const monthlySummary = useMemo(() => {
    const months = ['Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026'];
    return months.map((m) => {
      const sub = invoices.filter((i) => i.mes === m);
      return {
        mes: m.split(' ')[0].slice(0, 3),
        recaudado: sub.filter((i) => i.estado === 'Pagada').reduce((a, b) => a + b.valorTotal, 0) / 1000000,
        pendiente: sub.filter((i) => i.estado !== 'Pagada').reduce((a, b) => a + b.valorTotal, 0) / 1000000,
      };
    });
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (monthFilter !== 'Todos' && i.mes !== monthFilter) return false;
      if (statusFilter !== 'Todos' && i.estado !== statusFilter) return false;
      if (!q) return true;
      const cl = clientMap.get(i.clientId);
      return (
        i.id.toLowerCase().includes(q) ||
        (cl?.nombreCompleto.toLowerCase().includes(q) ?? false) ||
        (cl?.numeroContrato.includes(q) ?? false)
      );
    });
  }, [invoices, monthFilter, statusFilter, search, clientMap]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Gráfico mensual + Panel de cobros sospechosos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">
            Facturación y Recaudo Mensual (Millones COP)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="recaudado" name="Recaudado" fill="#00A859" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pendiente" name="Pendiente / Vencido" fill="#F2A900" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#003B5C] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F2A900]" />
              Auditoría Preventiva: Cobros Sospechosos ({suspiciousInvoices.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Facturas con cobros adicionales o saltos atípicos de consumo sin reclamación radicada aún.
          </p>
          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
            {suspiciousInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Todas las anomalías detectadas ya cuentan con PQR de oficio.
              </p>
            ) : (
              suspiciousInvoices.map((inv) => {
                const cl = clientMap.get(inv.clientId);
                return (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#003B5C] dark:text-amber-200">
                        {cl?.nombreCompleto} · Contrato {cl?.numeroContrato}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {inv.mes} · {inv.observacionesCobro || inv.cobrosAdicionales[0]?.concepto} · Total {formatCOP(inv.valorTotal)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        createExOfficioPQR(
                          inv,
                          inv.observacionesCobro || inv.cobrosAdicionales[0]?.concepto || 'Anomalía preventiva'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003B5C] hover:bg-[#00263D] text-white font-bold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Crear solicitud de oficio
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabla de 360 facturas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar factura, cliente o contrato..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <select
            aria-label="Filtrar por mes"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="Todos">Todos los meses</option>
            {['Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar por estado de pago"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pagada">Pagada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Vencida">Vencida</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#003B5C] text-white uppercase">
              <tr>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Titular / Contrato</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Consumo</th>
                <th className="px-4 py-3">Vencimiento / Corte</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginated.map((inv) => {
                const cl = clientMap.get(inv.clientId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold">{inv.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{cl?.nombreCompleto}</div>
                      <div className="text-[11px] font-mono text-slate-500">Contrato {cl?.numeroContrato}</div>
                    </td>
                    <td className="px-4 py-3">{inv.mes}</td>
                    <td className="px-4 py-3 font-mono">
                      {inv.consumo} {inv.unidad}
                    </td>
                    <td className="px-4 py-3">
                      <div>Vence: {inv.fechaVencimiento}</div>
                      <div className="text-[11px] text-slate-500">Corte: {inv.fechaCorte}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.estado === 'Pagada'
                            ? 'bg-emerald-100 text-[#007A43]'
                            : inv.estado === 'Pendiente'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-[#C93C3C]'
                        }`}
                      >
                        {inv.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {formatCOP(inv.valorTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span>Mostrando {paginated.length} de {filtered.length} facturas</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="font-mono font-bold">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
