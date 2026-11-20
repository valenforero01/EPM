import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  ShieldAlert,
  Sparkles,
  Truck,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCOP } from '../../utils/formatters';
import { PQRAdminDrawer } from '../../components/admin/PQRAdminDrawer';

const CHART_COLORS = ['#00A859', '#003B5C', '#F2A900', '#38BDF8', '#C93C3C', '#64748B', '#8B5CF6'];

export const AdminDashboardPage: React.FC = () => {
  const { pqrRequests, techVisits, ruleConfig, prioritizePQR } = useAppStore();

  const [filterPeriod, setFilterPeriod] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterType, setFilterType] = useState('Todos');
  const [filterService, setFilterService] = useState('Todos');
  const [drawerPqrId, setDrawerPqrId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return pqrRequests.filter((r) => {
      if (filterPeriod !== 'Todos' && r.mesReclamado !== filterPeriod) return false;
      if (filterStatus !== 'Todos' && r.estado !== filterStatus) return false;
      if (filterType !== 'Todos' && r.tipoInconformidad !== filterType) return false;
      if (filterService !== 'Todos' && r.servicio !== filterService) return false;
      return true;
    });
  }, [pqrRequests, filterPeriod, filterStatus, filterType, filterService]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const pendientes = filtered.filter((r) => !['Procedente', 'No procedente', 'Cerrada'].includes(r.estado)).length;
    const resueltas = filtered.filter((r) => ['Procedente', 'No procedente', 'Cerrada'].includes(r.estado)).length;
    const procedentes = filtered.filter((r) => r.estado === 'Procedente' || r.estado === 'Cerrada').length;
    const stpAuto = filtered.filter((r) => r.responsable === 'Automático STP').length;
    const amiCount = filtered.filter((r) => r.estado === 'En validación AMI' || Boolean(r.resultadoMotorReglas.amiLecturaRemota)).length;
    const visitasCount = techVisits.filter((v) => v.estado !== 'Realizada').length;
    const riesgoSla = filtered.filter(
      (r) => !['Procedente', 'No procedente', 'Cerrada'].includes(r.estado) && r.diasTranscurridosSLA >= ruleConfig.diaAlertaTemprana
    ).length;
    const dictamen13 = filtered.filter(
      (r) => !['Procedente', 'No procedente', 'Cerrada'].includes(r.estado) && r.diasTranscurridosSLA >= ruleConfig.diaDictamenPreventivo
    ).length;
    const totalReclamado = filtered.reduce((acc, r) => acc + r.valorReclamado, 0);
    const totalAjustado = filtered.reduce((acc, r) => acc + r.valorAjustado, 0);
    const avgSla = total > 0 ? (filtered.reduce((acc, r) => acc + r.diasTranscurridosSLA, 0) / total).toFixed(1) : '0.0';

    return {
      total,
      pendientes,
      resueltas,
      pctAuto: total ? Math.round((stpAuto / total) * 100) : 0,
      pctProcedente: resueltas ? Math.round((procedentes / resueltas) * 100) : 0,
      avgSla,
      riesgoSla,
      dictamen13,
      amiCount,
      visitasCount,
      totalReclamado,
      totalAjustado,
    };
  }, [filtered, techVisits, ruleConfig]);

  const byStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => {
      map[r.estado] = (map[r.estado] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => {
      const shortName =
        r.tipoInconformidad === 'Reconexión cobrada tras pago'
          ? 'Reconexión'
          : r.tipoInconformidad === 'Tarifa de medidor/contador'
          ? 'Tarifa'
          : r.tipoInconformidad;
      map[shortName] = (map[shortName] || 0) + 1;
    });
    return Object.entries(map).map(([name, cantidad]) => ({ name, cantidad }));
  }, [filtered]);

  const byMonthData = useMemo(() => {
    const months = ['Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026'];
    return months.map((m) => {
      const subset = filtered.filter((r) => r.mesReclamado === m);
      return {
        mes: m.split(' ')[0].slice(0, 3),
        total: subset.length,
        stp: subset.filter((r) => r.responsable === 'Automático STP').length,
      };
    });
  }, [filtered]);

  const byServiceData = useMemo(() => {
    return (['Energía', 'Acueducto', 'Gas'] as const).map((srv) => ({
      servicio: srv,
      casos: filtered.filter((r) => r.servicio === srv).length,
    }));
  }, [filtered]);

  const autoVsHumanData = useMemo(() => {
    const stp = filtered.filter((r) => r.responsable === 'Automático STP').length;
    const human = filtered.length - stp;
    return [
      { name: 'Automático STP', value: stp },
      { name: 'Gestión Humana / Cuadrilla', value: human },
    ];
  }, [filtered]);

  const slaTrafficData = useMemo(() => {
    const active = filtered.filter((r) => !['Procedente', 'No procedente', 'Cerrada'].includes(r.estado));
    return [
      { tramo: '0–7 días (Verde)', casos: active.filter((r) => r.diasTranscurridosSLA <= 7).length },
      { tramo: '8–12 días (Alerta)', casos: active.filter((r) => r.diasTranscurridosSLA >= 8 && r.diasTranscurridosSLA <= 12).length },
      { tramo: '13–15 días (Crítico)', casos: active.filter((r) => r.diasTranscurridosSLA >= 13).length },
    ];
  }, [filtered]);

  const earlyWarnings = useMemo(() => {
    return pqrRequests
      .filter(
        (r) =>
          !['Procedente', 'No procedente', 'Cerrada'].includes(r.estado) &&
          r.diasTranscurridosSLA >= ruleConfig.diaAlertaTemprana
      )
      .sort((a, b) => b.diasTranscurridosSLA - a.diasTranscurridosSLA);
  }, [pqrRequests, ruleConfig.diaAlertaTemprana]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros globales */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#003B5C] dark:text-emerald-300 mr-2">
          <Filter className="w-4 h-4" />
          Filtros globales:
        </div>
        <select
          aria-label="Filtrar por periodo"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
        >
          <option value="Todos">Todos los periodos</option>
          {['Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
        >
          <option value="Todos">Todos los estados</option>
          {['Radicada', 'En validación AMI', 'Visita técnica', 'Análisis', 'Pendiente de aprobación', 'Procedente', 'No procedente', 'Cerrada'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          aria-label="Filtrar por tipo de inconformidad"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
        >
          <option value="Todos">Todos los motivos</option>
          <option value="Reconexión cobrada tras pago">Reconexión tras pago</option>
          <option value="Lectura errónea">Lectura errónea</option>
          <option value="Tarifa de medidor/contador">Tarifa de medidor</option>
          <option value="Otro">Otro</option>
        </select>

        <select
          aria-label="Filtrar por servicio"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
        >
          <option value="Todos">Todos los servicios</option>
          <option value="Energía">Energía</option>
          <option value="Acueducto">Acueducto</option>
          <option value="Gas">Gas</option>
        </select>
      </div>

      {/* 12 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total PQR', value: kpis.total, icon: FileText, tone: 'text-[#003B5C] dark:text-white' },
          { label: 'En Trámite', value: kpis.pendientes, icon: Clock, tone: 'text-amber-600' },
          { label: 'Resueltas / Cerradas', value: kpis.resueltas, icon: CheckCircle2, tone: 'text-[#00A859]' },
          { label: '% Automático STP', value: `${kpis.pctAuto}%`, icon: Sparkles, tone: 'text-[#00A859]' },
          { label: '% Procedencia', value: `${kpis.pctProcedente}%`, icon: ArrowUpRight, tone: 'text-sky-600' },
          { label: 'Promedio SLA', value: `${kpis.avgSla} días`, icon: Clock, tone: 'text-[#003B5C] dark:text-slate-200' },
          { label: `Riesgo SLA (Día ${ruleConfig.diaAlertaTemprana}+)`, value: kpis.riesgoSla, icon: AlertTriangle, tone: 'text-amber-600' },
          { label: `Dictamen Día ${ruleConfig.diaDictamenPreventivo}+`, value: kpis.dictamen13, icon: ShieldAlert, tone: 'text-[#C93C3C]' },
          { label: 'Validación AMI', value: kpis.amiCount, icon: Wifi, tone: 'text-sky-600' },
          { label: 'Visitas Activas', value: kpis.visitasCount, icon: Truck, tone: 'text-[#003B5C] dark:text-slate-200' },
          { label: 'Monto Reclamado', value: formatCOP(kpis.totalReclamado), icon: FileText, tone: 'text-slate-800 dark:text-slate-100' },
          { label: 'Notas Crédito', value: formatCOP(kpis.totalAjustado), icon: CheckCircle2, tone: 'text-[#00A859]' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold truncate">{k.label}</span>
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
              </div>
              <div className={`mt-2 text-lg sm:text-xl font-extrabold tabular-nums truncate ${k.tone}`}>
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6 Gráficas Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Estado (Donut) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Distribución por Estado</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {byStatusData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Tipo de cobro (Barras) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Casos por Motivo de Cobro</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#003B5C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Tendencia mensual (Línea) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Tendencia Mensual vs STP</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ee" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="total" name="Radicadas" stroke="#003B5C" strokeWidth={2.5} />
                <Line type="monotone" dataKey="stp" name="Automático STP" stroke="#00A859" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Por Servicio (Barras) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Solicitudes por Servicio</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byServiceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ee" />
                <XAxis dataKey="servicio" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="casos" fill="#00A859" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Automático vs Humano (Donut) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Resolución Automática vs Humana</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={autoVsHumanData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                  <Cell fill="#00A859" />
                  <Cell fill="#003B5C" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Semáforo SLA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#003B5C] dark:text-white mb-4">Semáforo SLA Casos Activos</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaTrafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ee" />
                <XAxis dataKey="tramo" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="casos" radius={[8, 8, 0, 0]}>
                  <Cell fill="#00A859" />
                  <Cell fill="#F2A900" />
                  <Cell fill="#C93C3C" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Panel de Alertas Tempranas SLA (Día 8+ y Día 13+) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#003B5C] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F2A900]" />
              Control Preventivo SLA (Alerta Día {ruleConfig.diaAlertaTemprana} · Dictamen Preventivo Día {ruleConfig.diaDictamenPreventivo})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prevención del silencio administrativo positivo antes de cumplir los {ruleConfig.slaDiasHabiles} días hábiles de la Ley 142/1994.
            </p>
          </div>
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
            {earlyWarnings.length} solicitudes en seguimiento
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
              <tr>
                <th className="px-3 py-2.5">Radicado</th>
                <th className="px-3 py-2.5">Titular</th>
                <th className="px-3 py-2.5">Motivo</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">SLA</th>
                <th className="px-3 py-2.5">Nivel</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {earlyWarnings.map((r) => {
                const isCritical = r.diasTranscurridosSLA >= ruleConfig.diaDictamenPreventivo;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-[#003B5C] dark:text-emerald-300">
                      {r.id}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{r.nombreCliente}</td>
                    <td className="px-3 py-2.5">{r.tipoInconformidad}</td>
                    <td className="px-3 py-2.5">{r.estado}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      Día {r.diasTranscurridosSLA}/{ruleConfig.slaDiasHabiles}
                    </td>
                    <td className="px-3 py-2.5">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#C93C3C] font-bold">
                          Dictamen preventivo (Día 13+)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          Alerta temprana (Día 8+)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-2">
                      {!r.priorizada && (
                        <button
                          type="button"
                          onClick={() => prioritizePQR(r.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        >
                          Priorizar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDrawerPqrId(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#003B5C] text-white font-bold"
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
      </div>

      <PQRAdminDrawer pqrId={drawerPqrId} onClose={() => setDrawerPqrId(null)} />
    </div>
  );
};
