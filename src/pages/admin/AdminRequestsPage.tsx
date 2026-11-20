import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  LayoutGrid,
  Table as TableIcon,
  PlusCircle,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { KanbanColumn, PQRDisputeType, PQRRequest, PQRStatus } from '../../types';
import { formatCOP } from '../../utils/formatters';
import { PQRAdminDrawer } from '../../components/admin/PQRAdminDrawer';

const KANBAN_COLS: KanbanColumn[] = [
  'Radicada',
  'En validación',
  'Visita técnica',
  'Análisis',
  'Resuelta',
  'Cerrada',
];

function mapStatusToColumn(st: PQRStatus): KanbanColumn {
  if (st === 'Radicada') return 'Radicada';
  if (st === 'En validación' || st === 'En validación AMI') return 'En validación';
  if (st === 'Visita técnica') return 'Visita técnica';
  if (st === 'Análisis' || st === 'Pendiente de aprobación') return 'Análisis';
  if (st === 'Procedente' || st === 'No procedente') return 'Resuelta';
  return 'Cerrada';
}

function mapColumnToStatus(col: KanbanColumn): PQRStatus {
  if (col === 'Resuelta') return 'Procedente';
  return col;
}

export const AdminRequestsPage: React.FC = () => {
  const { pqrRequests, clients, invoices, updatePQRStatus, createPQR, addToast } = useAppStore();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerPqrId, setDrawerPqrId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Modal nueva solicitud de oficio
  const [oficioOpen, setOficioOpen] = useState(false);
  const [oficioClientId, setOficioClientId] = useState(clients[0]?.id || '');
  const [oficioTipo, setOficioTipo] = useState<PQRDisputeType>('Reconexión cobrada tras pago');
  const [oficioValor, setOficioValor] = useState(48300);
  const [oficioDesc, setOficioDesc] = useState('Revisión de oficio por anomalía detectada en facturación.');

  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pqrRequests
      .filter((r) => {
        if (statusFilter !== 'Todos' && r.estado !== statusFilter) return false;
        if (!q) return true;
        return (
          r.id.toLowerCase().includes(q) ||
          r.nombreCliente.toLowerCase().includes(q) ||
          r.contrato.includes(q) ||
          r.tipoInconformidad.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        sortAsc ? a.diasTranscurridosSLA - b.diasTranscurridosSLA : b.diasTranscurridosSLA - a.diasTranscurridosSLA
      );
  }, [pqrRequests, search, statusFilter, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = () => {
    const headers = ['Radicado', 'Titular', 'Contrato', 'Servicio', 'Motivo', 'Estado', 'SLA_Dias', 'Facturado', 'Reclamado', 'Ajustado'];
    const rows = filtered.map((r) => [
      r.id,
      `"${r.nombreCliente}"`,
      r.contrato,
      r.servicio,
      `"${r.tipoInconformidad}"`,
      r.estado,
      r.diasTranscurridosSLA,
      r.valorFacturado,
      r.valorReclamado,
      r.valorAjustado,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solicitudes_pqr_epm.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateOficio = (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find((c) => c.id === oficioClientId);
    if (!cl) return;
    const inv = invoices.find((i) => i.clientId === cl.id && i.mes === 'Octubre 2026');
    const created = createPQR({
      client: cl,
      invoice: inv,
      tipoInconformidad: oficioTipo,
      valorFacturado: inv?.valorTotal || 140000,
      valorReclamado: oficioValor,
      descripcionHechos: oficioDesc,
      autorizaCopiaCorreo: true,
      canalRadicacion: 'Oficio EPM',
    });
    setOficioOpen(false);
    addToast({ type: 'success', title: `Solicitud de oficio ${created.id} radicada` });
    setDrawerPqrId(created.id);
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar radicado, cliente o contrato..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="Todos">Todos los estados ({pqrRequests.length})</option>
            {['Radicada', 'En validación AMI', 'Visita técnica', 'Análisis', 'Pendiente de aprobación', 'Procedente', 'No procedente', 'Cerrada'].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-[#003B5C] dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-[#003B5C] dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => setOficioOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Solicitud de oficio
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#003B5C] text-white uppercase">
                <tr>
                  <th className="px-4 py-3">Radicado</th>
                  <th className="px-4 py-3">Cliente / Contrato</th>
                  <th className="px-4 py-3">Servicio & Motivo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSortAsc(!sortAsc)}
                      className="inline-flex items-center gap-1 font-bold"
                    >
                      SLA
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Reclamado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginated.map((r) => {
                  const pct = Math.min(100, Math.round((r.diasTranscurridosSLA / 15) * 100));
                  const barColor =
                    r.diasTranscurridosSLA >= 13
                      ? 'bg-[#C93C3C]'
                      : r.diasTranscurridosSLA >= 8
                      ? 'bg-[#F2A900]'
                      : 'bg-[#00A859]';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-bold text-[#003B5C] dark:text-emerald-300">
                        {r.id}
                        <div className="text-[10px] font-sans font-normal text-slate-400">{r.fechaRadicacion}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold">{r.nombreCliente}</div>
                        <div className="text-[11px] font-mono text-slate-500">Contrato {r.contrato}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.tipoInconformidad}</div>
                        <div className="text-[11px] text-slate-500">{r.servicio} · {r.mesReclamado}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-[#003B5C] dark:text-slate-200">
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span>{r.diasTranscurridosSLA}/15 d</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        {formatCOP(r.valorReclamado)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDrawerPqrId(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#003B5C] hover:bg-[#00263D] text-white font-bold"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span>
              Mostrando {paginated.length} de {filtered.length} solicitudes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="font-mono font-bold">
                {page} / {totalPages}
              </span>
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
      ) : (
        /* Vista Kanban Drag & Drop */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLS.map((col) => {
            const colItems: PQRRequest[] = filtered.filter((r) => mapStatusToColumn(r.estado) === col);
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    updatePQRStatus(draggedId, mapColumnToStatus(col));
                    setDraggedId(null);
                  }
                }}
                className="bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 min-h-[420px] flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-[#003B5C] dark:text-white">{col}</span>
                  <span className="text-[11px] font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[540px]">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedId(item.id)}
                      onClick={() => setDrawerPqrId(item.id)}
                      className="cursor-pointer bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-xs hover:shadow-md transition-shadow space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#00A859]">{item.id}</span>
                        <span className="text-[10px] font-mono text-slate-500">Día {item.diasTranscurridosSLA}/15</span>
                      </div>
                      <div className="text-xs font-bold truncate">{item.nombreCliente}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.tipoInconformidad}</div>
                      <div className="text-xs font-mono font-bold text-[#003B5C] dark:text-sky-300">
                        {formatCOP(item.valorReclamado)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear solicitud de oficio */}
      {oficioOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#003B5C] dark:text-white">
                Crear Solicitud de Oficio EPM
              </h2>
              <button type="button" onClick={() => setOficioOpen(false)} aria-label="Cerrar modal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOficio} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Cliente</label>
                <select
                  value={oficioClientId}
                  onChange={(e) => setOficioClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numeroContrato} · {c.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Motivo detectado</label>
                <select
                  value={oficioTipo}
                  onChange={(e) => setOficioTipo(e.target.value as PQRDisputeType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Reconexión cobrada tras pago">Reconexión cobrada tras pago</option>
                  <option value="Lectura errónea">Lectura errónea</option>
                  <option value="Tarifa de medidor/contador">Tarifa de medidor/contador</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Valor reclamado / a ajustar (COP)</label>
                <input
                  type="number"
                  required
                  value={oficioValor}
                  onChange={(e) => setOficioValor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Descripción técnica</label>
                <textarea
                  rows={3}
                  required
                  value={oficioDesc}
                  onChange={(e) => setOficioDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOficioOpen(false)} className="px-4 py-2 rounded-xl border border-slate-300">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A859] text-white font-bold">
                  Radicar de oficio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PQRAdminDrawer pqrId={drawerPqrId} onClose={() => setDrawerPqrId(null)} />
    </div>
  );
};
