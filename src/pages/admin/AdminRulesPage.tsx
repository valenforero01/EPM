import React, { useEffect, useMemo, useState } from 'react';
import {
  Sliders,
  Webhook,
  RotateCcw,
  Play,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { evaluateBRMS } from '../../utils/rulesEngine';
import { PQRDisputeType } from '../../types';
import { N8nTestResult } from '../../utils/n8nWebhook';

export const AdminRulesPage: React.FC = () => {
  const {
    ruleConfig,
    updateRuleConfig,
    n8nWebhookUrl,
    updateN8nWebhookUrl,
    testN8nWebhook,
    resetDemoData,
    clients,
    invoices,
  } = useAppStore();

  const [tolerancia, setTolerancia] = useState(ruleConfig.toleranciaPorcentaje);
  const [alertaDia, setAlertaDia] = useState(ruleConfig.diaAlertaTemprana);
  const [dictamenDia, setDictamenDia] = useState(ruleConfig.diaDictamenPreventivo);
  const [slaMax, setSlaMax] = useState(ruleConfig.slaDiasHabiles);
  const [stpActivo, setStpActivo] = useState(ruleConfig.resolucionAutomaticaActiva);
  const [webhookInput, setWebhookInput] = useState(n8nWebhookUrl);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<N8nTestResult | null>(null);
  const [showWebhookPayload, setShowWebhookPayload] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setWebhookInput(n8nWebhookUrl);
  }, [n8nWebhookUrl]);

  // Simulador de decisión BRMS
  const [simType, setSimType] = useState<PQRDisputeType>('Reconexión cobrada tras pago');
  const [simPaidBeforeCutoff, setSimPaidBeforeCutoff] = useState(true);
  const [simDeltaPct, setSimDeltaPct] = useState(35);

  const simPreview = useMemo(() => {
    const sampleClient = clients[0];
    const sampleInv = invoices.find((i) => i.clientId === sampleClient.id && i.mes === 'Octubre 2026');
    const tempCfg = {
      toleranciaPorcentaje: tolerancia,
      diaAlertaTemprana: alertaDia,
      diaDictamenPreventivo: dictamenDia,
      slaDiasHabiles: slaMax,
      resolucionAutomaticaActiva: stpActivo,
    };

    const avgCons = sampleInv?.consumo || 180;
    const simulatedReading =
      simType === 'Lectura errónea'
        ? (sampleInv?.lecturaAnterior || 4000) + Math.round(avgCons * (1 + simDeltaPct / 100))
        : undefined;

    return evaluateBRMS({
      client: sampleClient,
      invoice: sampleInv
        ? {
            ...sampleInv,
            fechaPago: simPaidBeforeCutoff ? sampleInv.fechaVencimiento : '28/10/2026',
            cobrosAdicionales: simType === 'Reconexión cobrada tras pago' ? [{ concepto: 'Reconexión', valor: 48300 }] : [],
          }
        : undefined,
      clientInvoices: invoices.filter((i) => i.clientId === sampleClient.id),
      tipoInconformidad: simType,
      valorFacturado: 145000,
      valorReclamado: 48300,
      fechaPagoRealizado: simPaidBeforeCutoff ? '14/10/2026' : '28/10/2026',
      lecturaReportada: simulatedReading,
      descripcionHechos: `Simulación de escenario ${simType} desde consola BRMS.`,
      config: tempCfg,
    });
  }, [clients, invoices, tolerancia, alertaDia, dictamenDia, slaMax, stpActivo, simType, simPaidBeforeCutoff, simDeltaPct]);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateRuleConfig({
      toleranciaPorcentaje: tolerancia,
      diaAlertaTemprana: alertaDia,
      diaDictamenPreventivo: dictamenDia,
      slaDiasHabiles: slaMax,
      resolucionAutomaticaActiva: stpActivo,
    });
  };

  const handleSaveWebhookUrl = () => {
    const trimmed = webhookInput.trim();
    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Protocolo inválido');
        }
      } catch {
        setWebhookTestResult({
          ok: false,
          mode: 'Error',
          latencyMs: 0,
          timestamp: new Date().toLocaleTimeString('es-CO'),
          endpoint: trimmed,
          errorMessage: 'URL inválida. Debe iniciar por https:// o http://.',
          payloadSent: {},
        });
        return;
      }
    }
    updateN8nWebhookUrl(trimmed);
  };

  const handleClearWebhookUrl = () => {
    setWebhookInput('');
    setWebhookTestResult(null);
    updateN8nWebhookUrl('');
  };

  const handleTestWebhook = async () => {
    const trimmed = webhookInput.trim();
    setTestingWebhook(true);
    const result = await testN8nWebhook(trimmed);
    setWebhookTestResult(result);
    setTestingWebhook(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parámetros del motor BRMS */}
        <form
          onSubmit={handleSaveRules}
          className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#00A859]" />
            <h2 className="text-base font-bold text-[#003B5C] dark:text-white">
              Parámetros del Motor de Reglas (BRMS)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Tolerancia desviación lectura (%)</label>
              <input
                type="number"
                min={5}
                max={80}
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Plazo SLA legal (días hábiles)</label>
              <input
                type="number"
                min={5}
                max={30}
                value={slaMax}
                onChange={(e) => setSlaMax(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Día alerta temprana SLA</label>
              <input
                type="number"
                min={1}
                max={14}
                value={alertaDia}
                onChange={(e) => setAlertaDia(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Día dictamen preventivo</label>
              <input
                type="number"
                min={2}
                max={15}
                value={dictamenDia}
                onChange={(e) => setDictamenDia(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold pt-2">
            <input
              type="checkbox"
              checked={stpActivo}
              onChange={(e) => setStpActivo(e.target.checked)}
              className="w-4 h-4 accent-[#00A859]"
            />
            Resolución automática STP activa (si se desactiva, pasa a “Pendiente de aprobación”)
          </label>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white text-xs font-bold"
          >
            Guardar configuración BRMS
          </button>
        </form>

        {/* Simulador de decisión */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-[#003B5C] dark:text-sky-400" />
            <h2 className="text-base font-bold text-[#003B5C] dark:text-white">
              Simulador de Impacto de Reglas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Escenario de prueba</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as PQRDisputeType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="Reconexión cobrada tras pago">Reconexión cobrada tras pago</option>
                <option value="Lectura errónea">Lectura errónea</option>
                <option value="Tarifa de medidor/contador">Tarifa de medidor/contador</option>
              </select>
            </div>
            {simType === 'Reconexión cobrada tras pago' ? (
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={simPaidBeforeCutoff}
                    onChange={(e) => setSimPaidBeforeCutoff(e.target.checked)}
                  />
                  Pago efectuado antes de fecha de corte
                </label>
              </div>
            ) : (
              <div>
                <label className="block font-bold mb-1">Desviación simulada ({simDeltaPct}%)</label>
                <input
                  type="range"
                  min={5}
                  max={70}
                  value={simDeltaPct}
                  onChange={(e) => setSimDeltaPct(Number(e.target.value))}
                  className="w-full accent-[#00A859]"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-[#F5F8FA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-1.5 text-xs">
            <div className="font-bold text-[#00A859]">
              Resultado proyectado: {simPreview.estado} ({simPreview.responsable})
            </div>
            <div className="font-semibold text-[#003B5C] dark:text-white">{simPreview.decision}</div>
            <p className="text-slate-600 dark:text-slate-300">{simPreview.justificacionTecnica}</p>
            <p className="text-[11px] font-mono text-slate-500">Regla: {simPreview.reglaAplicada}</p>
          </div>
        </div>
      </div>

      {/* Panel de configuración Webhook n8n */}
      <section
        aria-labelledby="n8n-config-title"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8EE] dark:border-slate-800 p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-[#EA4B71]" aria-hidden="true" />
              <h2 id="n8n-config-title" className="text-base font-bold text-[#003B5C] dark:text-white">
                Configuración de Webhook n8n · Envío de Copia por Correo
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Configura el endpoint POST de tu flujo en <strong>n8n</strong> para el envío automático de constancias. Al pulsar <strong>“Enviar prueba”</strong>, se ejecutará una petición <code>POST</code> en formato JSON hacia la URL ingresada para verificar conectividad. Si la URL está vacía, los envíos operan en modo simulación local.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              n8nWebhookUrl
                ? 'bg-emerald-100 text-[#007A43] dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {n8nWebhookUrl ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Endpoint activo
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Modo simulación local
              </>
            )}
          </span>
        </div>

        <div className="space-y-2">
          <label htmlFor="n8n-webhook-url" className="block text-xs font-bold text-slate-700 dark:text-slate-200">
            URL del Webhook n8n (método POST)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="n8n-webhook-url"
              type="url"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="https://tu-instancia-n8n.app/webhook/epm-copia-pqr"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveWebhookUrl}
                className="px-4 py-2.5 rounded-xl bg-[#003B5C] hover:bg-[#00263D] text-white text-xs font-bold transition-colors"
              >
                Guardar URL
              </button>
              {webhookInput.trim() !== '' && (
                <button
                  type="button"
                  onClick={handleClearWebhookUrl}
                  aria-label="Limpiar URL del webhook"
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook || !webhookInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] text-white text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                {testingWebhook ? 'Enviando POST...' : 'Enviar prueba'}
              </button>
            </div>
          </div>
          {!webhookInput.trim() && (
            <p className="text-[11px] text-slate-500">
              Ingresa una URL de webhook válida (<code>https://...</code>) para habilitar la prueba de conectividad POST.
            </p>
          )}
        </div>

        {/* Resultado de prueba de conectividad */}
        {webhookTestResult && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-xs space-y-2 ${
              !webhookTestResult.ok
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : webhookTestResult.mode === 'no-cors'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                {webhookTestResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {webhookTestResult.ok
                    ? webhookTestResult.mode === 'no-cors'
                      ? 'POST enviado (modo no-cors)'
                      : `Conectividad verificada · HTTP ${webhookTestResult.statusCode}`
                    : 'Fallo en la prueba de conectividad POST'}
                </span>
              </div>
              <span className="font-mono text-[11px] opacity-80">
                {webhookTestResult.timestamp} · {webhookTestResult.latencyMs} ms · Modo: {webhookTestResult.mode}
              </span>
            </div>

            <p className="font-mono text-[11px] break-all opacity-90">
              POST → {webhookTestResult.endpoint || '(vacío)'}
            </p>

            {webhookTestResult.errorMessage && (
              <p className="font-medium">{webhookTestResult.errorMessage}</p>
            )}

            {webhookTestResult.responsePreview && (
              <div className="rounded-lg bg-white/70 dark:bg-slate-900/60 border border-black/10 dark:border-white/10 p-2.5 font-mono text-[11px] break-words">
                {webhookTestResult.responsePreview}
              </div>
            )}
          </div>
        )}

        {/* Guía rápida de variables en n8n y vista de payload */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowWebhookPayload(!showWebhookPayload)}
            aria-expanded={showWebhookPayload}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003B5C] dark:text-sky-300 hover:underline"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showWebhookPayload ? 'rotate-180' : ''}`}
            />
            {showWebhookPayload
              ? 'Ocultar estructura JSON y expresiones para n8n'
              : 'Ver estructura JSON y expresiones recomendadas para n8n'}
          </button>

          {showWebhookPayload && (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-[#F5F8FA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <div className="font-bold text-[#003B5C] dark:text-white">
                  Mapeo sugerido en el nodo Gmail / SMTP de n8n
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <li><strong>To:</strong> {'{{$json.body.cliente.correo}}'}</li>
                  <li><strong>Subject:</strong> {'{{$json.body.asunto}}'}</li>
                  <li><strong>HTML Body:</strong> {'{{$json.body.constanciaHTML}}'}</li>
                  <li><strong>Radicado:</strong> {'{{$json.body.radicado}}'}</li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto">
                <div className="text-[11px] font-bold text-emerald-300 mb-1.5">
                  Ejemplo / último payload JSON enviado por POST
                </div>
                <pre className="text-[11px] font-mono leading-relaxed max-h-44 overflow-y-auto">
                  {JSON.stringify(
                    webhookTestResult?.payloadSent && Object.keys(webhookTestResult.payloadSent).length > 0
                      ? { ...webhookTestResult.payloadSent, constanciaHTML: '<html>...</html>' }
                      : {
                          evento: 'prueba_conectividad_n8n',
                          pruebaConectividad: true,
                          radicado: 'PQR-2026-00001',
                          cliente: {
                            nombre: 'Titular de prueba',
                            correo: 'usuario@ejemplo.co',
                            contrato: '1045201',
                            servicio: 'Energía',
                          },
                          asunto: '[PRUEBA] Copia de solicitud PQR-2026-00001 – EPM',
                          constanciaHTML: '<html>...</html>',
                        },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Restablecer datos demo */}
      <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#C93C3C] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Restablecer Datos de Demostración
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Restaura las 45 PQRs, visitas, historial de auditoría y correos simulados a su estado inicial determinístico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C93C3C] hover:bg-rose-700 text-white text-xs font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer datos
        </button>
      </div>

      {confirmReset && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#003B5C] dark:text-white">¿Confirmar restablecimiento?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Se perderán las solicitudes nuevas o ediciones realizadas en esta sesión del navegador.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#C93C3C] text-white text-xs font-bold"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
