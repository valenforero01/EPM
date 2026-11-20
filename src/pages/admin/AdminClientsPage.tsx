import React, { useMemo, useState } from 'react';
import { Search, Download, Eye, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { Client } from '../../types';
import { formatCOP } from '../../utils/formatters';

export const AdminClientsPage: React.FC = () => {
  const { clients, invoices, pqrRequests } = useAppStore();
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('Todos');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (serviceFilter !== 'Todos' && c.servicio !== serviceFilter) return false;
      if (!q) return true;
      return (
        c.nombreCompleto.toLowerCase().includes(q) ||
        c.numeroContrato.includes(q) ||
        c.numeroDocumento.includes(q) ||
        c.municipio.toLowerCase().includes(q)
      );
    });
  }, [clients, search, serviceFilter]);

  const exportClientsCsv = () => {
    const headers = ['Contrato', 'Titular', 'Documento', 'Servicio', 'Municipio', 'Estrato', 'Medidor', 'Correo'];
    const rows = filtered.map((c) => [
      c.numeroContrato,
      `"${c.nombreCompleto}"`,
      `${c.tipoDocumento} ${c.numeroDocumento}`,
      c.servicio,
      c.municipio,
      c.estrato,
      c.tipoMedidor,
      c.correo,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'directorio_clientes_epm.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clientInvoices = selectedClient ? invoices.filter((i) => i.clientId === selectedClient.id) : [];
  const clientPqrs = selectedClient ? pqrRequests.filter((p) => p.clientId === selectedClient.id) : [];

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, contrato, cédula o municipio..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <select
            aria-label="Filtrar por servicio"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="Todos">Todos los servicios ({clients.length})</option>
            <option value="Energía">Energía</option>
            <option value="Acueducto">Acueducto</option>
            <option value="Gas">Gas</option>
          </select>
        </div>

        <button
          type="button"
          onClick={exportClientsCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar directorio CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#003B5C] text-white uppercase">
              <tr>
                <th className="px-4 py-3">Contrato</th>
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Servicio & Medidor</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estrato</th>
                <th className="px-4 py-3">PQRs</th>
                <th className="px-4 py-3 text-right">Vista 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((c) => {
                const countPqr = pqrRequests.filter((p) => p.clientId === c.id).length;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-[#003B5C] dark:text-emerald-300">
                      {c.numeroContrato}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{c.nombreCompleto}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.tipoDocumento} {c.numeroDocumento} · {c.correo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.servicio}</div>
                      <div className="text-[11px] text-slate-500">{c.tipoMedidor}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.municipio} · {c.barrio}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">Estrato {c.estrato}</td>
                    <td className="px-4 py-3 font-mono font-bold">{countPqr}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedClient(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00A859] text-white font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Cliente 360
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cliente 360 */}
      {selectedClient && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#003B5C] dark:text-white">
                  Cliente 360 · {selectedClient.nombreCompleto}
                </h2>
                <p className="text-xs text-slate-500">
                  Contrato <strong className="font-mono">{selectedClient.numeroContrato}</strong> · {selectedClient.tipoDocumento} {selectedClient.numeroDocumento} · {selectedClient.direccion}, {selectedClient.municipio} (Estrato {selectedClient.estrato})
                </p>
              </div>
              <button type="button" onClick={() => setSelectedClient(null)} aria-label="Cerrar vista Cliente 360">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gráfico de consumo 6 meses */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">
                Histórico de Consumo (Últimos 6 meses)
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientInvoices.map((i) => ({ mes: i.mes.split(' ')[0].slice(0, 3), consumo: i.consumo }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="consumo" fill="#00A859" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-[#003B5C] dark:text-white">Facturas ({clientInvoices.length})</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {clientInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <div className="font-bold">{inv.mes}</div>
                        {inv.cobrosAdicionales.length > 0 && (
                          <div className="text-[11px] text-rose-600 font-semibold">
                            Cobro extra: {inv.cobrosAdicionales[0].concepto}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">{formatCOP(inv.valorTotal)}</div>
                        <div className="text-[10px] text-slate-500">{inv.estado}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-[#003B5C] dark:text-white">Solicitudes PQR ({clientPqrs.length})</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {clientPqrs.length === 0 ? (
                    <p className="text-slate-400">Sin solicitudes radicadas.</p>
                  ) : (
                    clientPqrs.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div>
                          <div className="font-mono font-bold text-[#00A859]">{p.id}</div>
                          <div>{p.tipoInconformidad}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                          {p.estado}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
