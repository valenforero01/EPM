import React, { useState } from 'react';
import { Download, Printer, Shield, Mail, Eye, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';

export const AdminReportsPage: React.FC = () => {
  const { pqrRequests, auditLog, sentEmails } = useAppStore();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const exportGeneralReportCsv = () => {
    const headers = ['Radicado', 'Fecha', 'Cliente', 'Contrato', 'Servicio', 'Motivo', 'Estado', 'Responsable', 'SLA', 'Reclamado', 'Ajustado'];
    const rows = pqrRequests.map((r) => [
      r.id,
      r.fechaRadicacion,
      `"${r.nombreCliente}"`,
      r.contrato,
      r.servicio,
      `"${r.tipoInconformidad}"`,
      r.estado,
      r.responsable,
      r.diasTranscurridosSLA,
      r.valorReclamado,
      r.valorAjustado,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_ejecutivo_epm_pqr360.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAjustado = pqrRequests.reduce((a, b) => a + b.valorAjustado, 0);

  return (
    <div className="space-y-6">
      {/* Exportación ejecutiva */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#003B5C] dark:text-white">
            Reportes Ejecutivos y Cumplimiento Legal
          </h2>
          <p className="text-xs text-slate-500">
            Total solicitudes: <strong>{pqrRequests.length}</strong> · Total notas crédito emitidas:{' '}
            <strong className="font-mono text-[#00A859]">{formatCOP(totalAjustado)}</strong>
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportGeneralReportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            Exportar reporte CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#003B5C] hover:bg-[#00263D] text-white text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            Imprimir resumen PDF
          </button>
        </div>
      </div>

      {/* Bandeja de correos enviados / simulados n8n */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#EA4B71]" />
            Bandeja de Correos Enviados / n8n ({sentEmails.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Radicado</th>
                <th className="px-3 py-2.5">Destinatario</th>
                <th className="px-3 py-2.5">Asunto</th>
                <th className="px-3 py-2.5">Estado / Modo</th>
                <th className="px-3 py-2.5 text-right">Vista HTML</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sentEmails.map((em) => (
                <tr key={em.id}>
                  <td className="px-3 py-2.5 font-mono">{em.fecha}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-[#003B5C] dark:text-emerald-300">{em.radicado}</td>
                  <td className="px-3 py-2.5">{em.destinatario}</td>
                  <td className="px-3 py-2.5">{em.asunto}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#007A43] font-bold">
                      {em.estadoEnvio} · {em.modo}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setPreviewHtml(em.htmlPreview)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver HTML
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de auditoría */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#003B5C] dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00A859]" />
          Bitácora de Auditoría del Sistema ({auditLog.length} eventos)
        </h2>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 uppercase text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2.5">Fecha y hora</th>
                <th className="px-3 py-2.5">Actor</th>
                <th className="px-3 py-2.5">Rol</th>
                <th className="px-3 py-2.5">Acción</th>
                <th className="px-3 py-2.5">Entidad</th>
                <th className="px-3 py-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {auditLog.slice(0, 60).map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">{log.fecha}</td>
                  <td className="px-3 py-2 font-semibold">{log.actor}</td>
                  <td className="px-3 py-2">{log.rol}</td>
                  <td className="px-3 py-2 font-bold text-[#003B5C] dark:text-emerald-300">{log.accion}</td>
                  <td className="px-3 py-2 font-mono">{log.entidad}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{log.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewHtml && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-[#003B5C]">Vista previa del correo enviado</h3>
              <button type="button" onClick={() => setPreviewHtml(null)} aria-label="Cerrar vista previa">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <iframe
              title="Vista previa correo HTML"
              srcDoc={previewHtml}
              className="w-full h-[500px] border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
