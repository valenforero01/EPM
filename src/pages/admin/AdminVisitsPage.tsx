import React, { useState } from 'react';
import { Truck, CheckCircle2, CalendarClock, ClipboardCheck, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TechVisit } from '../../types';

export const AdminVisitsPage: React.FC = () => {
  const { techVisits, submitVisitReport } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<'Todas' | TechVisit['estado']>('Todas');
  const [activeVisit, setActiveVisit] = useState<TechVisit | null>(null);
  const [lectura, setLectura] = useState<number>(5120);
  const [selloIntacto, setSelloIntacto] = useState(true);
  const [observaciones, setObservaciones] = useState('Medidor verificado en sitio, sin derivaciones.');
  const [tecnico, setTecnico] = useState('Ing. Mateo Cardona (Cuadrilla 01)');

  const filtered = techVisits.filter((v) => (filterStatus === 'Todas' ? true : v.estado === filterStatus));

  const openReport = (v: TechVisit) => {
    setActiveVisit(v);
    setLectura(5120);
    setSelloIntacto(true);
    setObservaciones('Inspección física realizada en acometida y carátula del medidor.');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit) return;
    submitVisitReport(activeVisit.id, lectura, selloIntacto, observaciones, tecnico);
    setActiveVisit(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#003B5C] dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#00A859]" />
            Agenda de Visitas Técnicas y Cuadrillas
          </h2>
          <p className="text-xs text-slate-500">
            Al registrar un informe técnico digital, el motor BRMS re-evalúa automáticamente la PQR asociada.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['Todas', 'Programada', 'Reprogramada', 'Realizada'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterStatus === st
                  ? 'bg-[#003B5C] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#003B5C] dark:text-emerald-300">
                  {v.id} · {v.pqrId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    v.estado === 'Realizada'
                      ? 'bg-emerald-100 text-[#007A43]'
                      : v.estado === 'Reprogramada'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {v.estado}
                </span>
              </div>
              <div className="text-sm font-bold">{v.nombreCliente}</div>
              <p className="text-slate-500">
                Contrato <strong className="font-mono">{v.contrato}</strong> · {v.servicio}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{v.direccion}</p>
              <div className="flex items-center gap-2 pt-1 font-semibold text-[#003B5C] dark:text-sky-300">
                <CalendarClock className="w-4 h-4 text-[#00A859]" />
                {v.fecha} · {v.franja}
              </div>
              <p className="text-[11px] text-slate-500">Cuadrilla asignada: {v.cuadrilla}</p>

              {v.informeTecnico && (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <div className="font-bold text-[#007A43] dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Informe Registrado ({v.informeTecnico.fechaRegistro})
                  </div>
                  <p>Lectura verificada: <strong className="font-mono">{v.informeTecnico.lecturaVerificada}</strong> · Sello: {v.informeTecnico.selloIntacto ? 'Intacto' : 'Alterado'}</p>
                  <p className="text-slate-600 dark:text-slate-300">{v.informeTecnico.observaciones}</p>
                </div>
              )}
            </div>

            {v.estado !== 'Realizada' && (
              <button
                type="button"
                onClick={() => openReport(v)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold"
              >
                <ClipboardCheck className="w-4 h-4" />
                Registrar informe técnico
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal registro informe técnico */}
      {activeVisit && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#003B5C] dark:text-white">
                Informe Técnico · {activeVisit.pqrId}
              </h3>
              <button type="button" onClick={() => setActiveVisit(null)} aria-label="Cerrar informe">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Lectura física verificada</label>
                <input
                  type="number"
                  required
                  value={lectura}
                  onChange={(e) => setLectura(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="sello-check"
                  type="checkbox"
                  checked={selloIntacto}
                  onChange={(e) => setSelloIntacto(e.target.checked)}
                />
                <label htmlFor="sello-check" className="font-semibold">
                  Sello metrológico intacto (desmarcar si hay anomalía en medidor)
                </label>
              </div>
              <div>
                <label className="block font-bold mb-1">Técnico responsable</label>
                <input
                  type="text"
                  required
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Observaciones en campo</label>
                <textarea
                  rows={3}
                  required
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveVisit(null)} className="px-4 py-2 rounded-xl border border-slate-300">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#00A859] text-white font-bold">
                  Guardar y re-evaluar PQR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
