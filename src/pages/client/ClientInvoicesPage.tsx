import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileWarning } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';
import { Invoice } from '../../types';

export const ClientInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, clients, invoices, setFilingPrefill } = useAppStore();

  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;
  if (!client) return null;

  const clientInvoices = invoices.filter((i) => i.clientId === client.id);

  const handleClaimInvoice = (inv: Invoice) => {
    const extraSum = inv.cobrosAdicionales.reduce((a, b) => a + b.valor, 0);
    setFilingPrefill({
      mesReclamado: inv.mes,
      tipoInconformidad: extraSum > 0 ? 'Reconexión cobrada tras pago' : 'Lectura errónea',
      valorFacturado: inv.valorTotal,
      valorReclamado: extraSum > 0 ? extraSum : Math.round(inv.valorTotal * 0.35),
      fechaPagoRealizado: inv.fechaPago,
      referenciaComprobante: inv.referenciaPago,
      descripcionHechos: `Reclamación sobre factura ${inv.id} del periodo ${inv.mes}.`,
    });
    navigate('/clientes/radicar');
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de consumo 6 meses */}
      <div className="bg-white rounded-2xl border border-[#E2E8EE] p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-[#003B5C] mb-1">
          Histórico de Consumo ({client.servicio})
        </h1>
        <p className="text-xs text-slate-500 mb-4">
          Comparativo de los últimos 6 ciclos facturados en {clientInvoices[0]?.unidad || 'unidades'}.
        </p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={clientInvoices.map((i) => ({
                mes: i.mes.split(' ')[0].slice(0, 3),
                consumo: i.consumo,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ee" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="consumo" name={`Consumo (${clientInvoices[0]?.unidad || ''})`} fill="#00A859" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="bg-white rounded-2xl border border-[#E2E8EE] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-[#003B5C]">Detalle de Facturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#003B5C] text-white uppercase">
              <tr>
                <th className="px-4 py-3">Periodo / Factura</th>
                <th className="px-4 py-3">Lecturas</th>
                <th className="px-4 py-3">Consumo</th>
                <th className="px-4 py-3">Cobros Adicionales</th>
                <th className="px-4 py-3">Vencimiento / Corte</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clientInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#003B5C]">{inv.mes}</div>
                    <div className="font-mono text-[11px] text-slate-500">{inv.id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {inv.lecturaAnterior} → {inv.lecturaActual}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {inv.consumo} {inv.unidad}
                  </td>
                  <td className="px-4 py-3">
                    {inv.cobrosAdicionales.length > 0 ? (
                      <div className="text-rose-700 font-semibold">
                        {inv.cobrosAdicionales[0].concepto} ({formatCOP(inv.cobrosAdicionales[0].valor)})
                      </div>
                    ) : (
                      <span className="text-slate-400">Ninguno</span>
                    )}
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
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleClaimInvoice(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003B5C] hover:bg-[#00263D] text-white font-bold"
                    >
                      <FileWarning className="w-3.5 h-3.5" />
                      Reclamar este cobro
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
