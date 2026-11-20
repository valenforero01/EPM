import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Cpu,
  FileSearch,
  Mail,
  Printer,
  Send,
  Upload,
  CalendarClock,
  Wifi,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ContactChannel, DocumentType, PQRDisputeType, PQRRequest, ServiceType } from '../../types';
import { formatCOP, getNextBusinessDateCO } from '../../utils/formatters';
import { createMockMeterSvgDataUri, createMockReceiptSvgDataUri } from '../../utils/mockAttachments';

const PIPELINE_STEPS = [
  'Extracción automática OCR de comprobante y carátula',
  'Consulta de recaudo en línea e histórico de 6 meses',
  'Evaluación de reglas de negocio (BRMS) y telemetría',
  'Generación de radicado y constancia PQR 360',
];

export const ClientFilingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    session,
    clients,
    invoices,
    filingPrefill,
    setFilingPrefill,
    createPQR,
    sendEmailCopy,
    setPrintablePqrId,
    scheduleOrRescheduleVisit,
    addToast,
  } = useAppStore();

  const client = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;
  const clientInvoices = client ? invoices.filter((i) => i.clientId === client.id) : [];

  // 14 campos validados + consentimiento opcional de copia por correo (marcado por defecto)
  const [nombreCompleto, setNombreCompleto] = useState(client?.nombreCompleto || '');
  const [tipoDocumento, setTipoDocumento] = useState<DocumentType>(client?.tipoDocumento || 'CC');
  const [numeroDocumento, setNumeroDocumento] = useState(client?.numeroDocumento || '');
  const [contrato, setContrato] = useState(client?.numeroContrato || '');
  const [servicio, setServicio] = useState<ServiceType>(client?.servicio || 'Energía');
  const [canalContacto, setCanalContacto] = useState<ContactChannel>(client?.canalPreferido || 'Correo electrónico');
  const [datoContacto, setDatoContacto] = useState(client?.celular || '');
  const [correoCliente, setCorreoCliente] = useState(client?.correo || '');
  const [tipoInconformidad, setTipoInconformidad] = useState<PQRDisputeType>(
    filingPrefill?.tipoInconformidad || 'Reconexión cobrada tras pago'
  );
  const [mesReclamado, setMesReclamado] = useState(
    filingPrefill?.mesReclamado || clientInvoices[clientInvoices.length - 1]?.mes || 'Octubre 2026'
  );
  const [valorFacturado, setValorFacturado] = useState<number>(
    filingPrefill?.valorFacturado || clientInvoices[clientInvoices.length - 1]?.valorTotal || 140000
  );
  const [valorReclamado, setValorReclamado] = useState<number>(filingPrefill?.valorReclamado || 48300);
  const [fechaPagoRealizado, setFechaPagoRealizado] = useState(filingPrefill?.fechaPagoRealizado || '14/10/2026');
  const [referenciaComprobante, setReferenciaComprobante] = useState(
    filingPrefill?.referenciaComprobante || 'EPM-PSE-77420'
  );
  const [lecturaReportada, setLecturaReportada] = useState<number>(
    filingPrefill?.lecturaReportada || (clientInvoices[clientInvoices.length - 1]?.lecturaAnterior || 4200) + 165
  );
  const [descripcionHechos, setDescripcionHechos] = useState(
    filingPrefill?.descripcionHechos ||
      'Solicito revisión de cobro improcedente en mi factura del periodo seleccionado.'
  );
  const [autorizaDatos, setAutorizaDatos] = useState(true);
  const [autorizaCopiaCorreo, setAutorizaCopiaCorreo] = useState(true);

  const [comprobantePreview, setComprobantePreview] = useState<string>('');
  const [fotoMedidorPreview, setFotoMedidorPreview] = useState<string>('');

  // Animación pipeline 4 pasos
  const [processingStep, setProcessingStep] = useState<number>(-1);
  const [resultPqr, setResultPqr] = useState<PQRRequest | null>(null);
  const [sendingMail, setSendingMail] = useState(false);

  // Reagendamiento directo si resulta en visita técnica
  const [visitDate, setVisitDate] = useState(getNextBusinessDateCO(2));
  const [visitSlot, setVisitSlot] = useState<'Mañana 08:00–12:00' | 'Tarde 13:00–17:00'>('Mañana 08:00–12:00');

  useEffect(() => {
    if (filingPrefill) {
      if (filingPrefill.mesReclamado) setMesReclamado(filingPrefill.mesReclamado);
      if (filingPrefill.tipoInconformidad) setTipoInconformidad(filingPrefill.tipoInconformidad);
      if (filingPrefill.valorFacturado) setValorFacturado(filingPrefill.valorFacturado);
      if (filingPrefill.valorReclamado) setValorReclamado(filingPrefill.valorReclamado);
      if (filingPrefill.fechaPagoRealizado) setFechaPagoRealizado(filingPrefill.fechaPagoRealizado);
      if (filingPrefill.referenciaComprobante) setReferenciaComprobante(filingPrefill.referenciaComprobante);
      if (filingPrefill.lecturaReportada) setLecturaReportada(filingPrefill.lecturaReportada);
      if (filingPrefill.descripcionHechos) setDescripcionHechos(filingPrefill.descripcionHechos);
      setFilingPrefill(null);
    }
  }, [filingPrefill, setFilingPrefill]);

  if (!client) return null;

  const handleFileUpload = (kind: 'receipt' | 'meter', file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (kind === 'receipt') setComprobantePreview(dataUrl);
      else setFotoMedidorPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateAttachment = (kind: 'receipt' | 'meter') => {
    if (kind === 'receipt') {
      setComprobantePreview(createMockReceiptSvgDataUri(referenciaComprobante, fechaPagoRealizado, formatCOP(valorFacturado)));
    } else {
      setFotoMedidorPreview(
        createMockMeterSvgDataUri(lecturaReportada, servicio === 'Energía' ? 'kWh' : 'm³')
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autorizaDatos) {
      addToast({ type: 'error', title: 'Debes autorizar el tratamiento de datos (Ley 1581/2012)' });
      return;
    }

    setProcessingStep(0);
    window.setTimeout(() => setProcessingStep(1), 450);
    window.setTimeout(() => setProcessingStep(2), 950);
    window.setTimeout(() => setProcessingStep(3), 1450);
    window.setTimeout(() => {
      const matchedInv = clientInvoices.find((i) => i.mes === mesReclamado);
      const created = createPQR({
        client,
        invoice: matchedInv,
        tipoInconformidad,
        valorFacturado,
        valorReclamado,
        fechaPagoRealizado: tipoInconformidad === 'Reconexión cobrada tras pago' ? fechaPagoRealizado : undefined,
        referenciaComprobante: tipoInconformidad === 'Reconexión cobrada tras pago' ? referenciaComprobante : undefined,
        lecturaReportada: tipoInconformidad === 'Lectura errónea' ? lecturaReportada : undefined,
        fotoMedidorUrl: fotoMedidorPreview || (tipoInconformidad === 'Lectura errónea' ? createMockMeterSvgDataUri(lecturaReportada) : undefined),
        comprobantePagoUrl: comprobantePreview || (tipoInconformidad === 'Reconexión cobrada tras pago' ? createMockReceiptSvgDataUri(referenciaComprobante, fechaPagoRealizado, formatCOP(valorFacturado)) : undefined),
        descripcionHechos,
        autorizaCopiaCorreo,
        canalRadicacion: 'Portal Clientes',
      });
      setProcessingStep(-1);
      setResultPqr(created);
    }, 1900);
  };

  if (processingStep >= 0) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E2E8EE] p-8 shadow-lg space-y-6 my-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-[#00A859]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#003B5C]">Procesando tu solicitud PQR 360</h1>
            <p className="text-xs text-slate-500">Ejecutando pipeline de autogestión TO-BE...</p>
          </div>
        </div>

        <div className="space-y-3">
          {PIPELINE_STEPS.map((label, idx) => {
            const done = idx < processingStep;
            const current = idx === processingStep;
            return (
              <div
                key={label}
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  done
                    ? 'bg-emerald-50 border-emerald-200 text-[#007A43] font-bold'
                    : current
                    ? 'bg-sky-50 border-sky-300 text-[#003B5C] font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${done || current ? 'opacity-100' : 'opacity-30'}`} />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (resultPqr) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#E2E8EE] p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase text-[#00A859]">Radicación Exitosa</span>
            <h1 className="text-2xl font-extrabold text-[#003B5C] font-mono">{resultPqr.id}</h1>
            <p className="text-xs text-slate-500">
              Estado: <strong>{resultPqr.estado}</strong> · Fecha límite legal: {resultPqr.fechaLimite}
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#007A43] text-xs font-extrabold">
            {resultPqr.responsable}
          </span>
        </div>

        <div className="rounded-2xl bg-[#F5F8FA] border border-slate-200 p-5 space-y-2">
          <div className="text-sm font-extrabold text-[#003B5C]">{resultPqr.resultadoMotorReglas.decision}</div>
          <p className="text-xs text-slate-700 leading-relaxed">{resultPqr.resultadoMotorReglas.justificacionTecnica}</p>
          <p className="text-[11px] text-slate-500">{resultPqr.resultadoMotorReglas.justificacionLegal}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Facturado</div>
            <div className="font-mono font-bold text-sm">{formatCOP(resultPqr.valorFacturado)}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Reclamado</div>
            <div className="font-mono font-bold text-sm">{formatCOP(resultPqr.valorReclamado)}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-emerald-700">Ajustado</div>
            <div className="font-mono font-bold text-sm text-[#007A43]">{formatCOP(resultPqr.valorAjustado)}</div>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
            <div className="text-[#003B5C]">Valor a pagar</div>
            <div className="font-mono font-bold text-sm text-[#003B5C]">{formatCOP(resultPqr.valorAPagar)}</div>
          </div>
        </div>

        {resultPqr.estado === 'En validación AMI' && (
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-3 text-xs">
            <Wifi className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#003B5C]">Validación por Medidor Inteligente AMI en curso</div>
              <p className="text-slate-600 mt-0.5">
                Tu contrato cuenta con telemetría AMI. No necesitas esperar visita física; el concentrador remoto confirmará el registro horario.
              </p>
            </div>
          </div>
        )}

        {resultPqr.resultadoMotorReglas.visitaAgendada && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2 text-xs">
            <div className="font-bold text-[#003B5C] flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              Visita Técnica Programada ({resultPqr.resultadoMotorReglas.visitaAgendada.fecha} ·{' '}
              {resultPqr.resultadoMotorReglas.visitaAgendada.franja})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
              <select
                value={visitSlot}
                onChange={(e) => setVisitSlot(e.target.value as 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Mañana 08:00–12:00">Mañana 08:00–12:00</option>
                <option value="Tarde 13:00–17:00">Tarde 13:00–17:00</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  scheduleOrRescheduleVisit(
                    resultPqr.id,
                    visitDate,
                    visitSlot,
                    resultPqr.resultadoMotorReglas.visitaAgendada!.cuadrilla,
                    client.nombreCompleto
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#003B5C] text-white font-bold"
              >
                Ajustar fecha/franja
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPrintablePqrId(resultPqr.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003B5C] text-white text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              Ver / Descargar constancia
            </button>
            {resultPqr.autorizaCopiaCorreo && (
              <button
                type="button"
                disabled={sendingMail}
                onClick={async () => {
                  setSendingMail(true);
                  await sendEmailCopy(resultPqr.id);
                  setSendingMail(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EA4B71] hover:bg-[#d63b60] text-white text-xs font-bold"
              >
                <Mail className="w-4 h-4" />
                {sendingMail ? 'Enviando...' : 'Enviar copia a mi correo'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/clientes/solicitudes')}
            className="text-xs font-bold text-[#00A859] hover:underline"
          >
            Ir a Mis solicitudes →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E2E8EE] p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[#003B5C]">Radicar PQR por Cobro Improcedente</h1>
        <p className="text-xs text-slate-500 mt-1">
          Completa los 14 campos de verificación. Nuestro motor de reglas evaluará tu caso automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. Nombre completo *</label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          {/* 2 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">2. Tipo de documento *</label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as DocumentType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="NIT">NIT</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          {/* 3 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">3. Número de documento *</label>
            <input
              type="text"
              required
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
          {/* 4 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">4. Número de contrato *</label>
            <input
              type="text"
              required
              value={contrato}
              onChange={(e) => setContrato(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
          {/* 5 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">5. Servicio *</label>
            <select
              value={servicio}
              onChange={(e) => setServicio(e.target.value as ServiceType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="Energía">Energía</option>
              <option value="Acueducto">Acueducto</option>
              <option value="Gas">Gas</option>
            </select>
          </div>
          {/* 6 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">6. Canal de contacto *</label>
            <select
              value={canalContacto}
              onChange={(e) => setCanalContacto(e.target.value as ContactChannel)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="Correo electrónico">Correo electrónico</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Teléfono">Teléfono</option>
            </select>
          </div>
          {/* 7 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">7. Teléfono / WhatsApp *</label>
            <input
              type="text"
              required
              value={datoContacto}
              onChange={(e) => setDatoContacto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
          {/* 8 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">8. Correo electrónico *</label>
            <input
              type="email"
              required
              value={correoCliente}
              onChange={(e) => setCorreoCliente(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>
          {/* 9 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">9. Tipo de inconformidad *</label>
            <select
              value={tipoInconformidad}
              onChange={(e) => setTipoInconformidad(e.target.value as PQRDisputeType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
            >
              <option value="Reconexión cobrada tras pago">Reconexión cobrada tras pago</option>
              <option value="Lectura errónea">Lectura errónea</option>
              <option value="Tarifa de medidor/contador">Tarifa de medidor/contador</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          {/* 10 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">10. Mes reclamado *</label>
            <select
              value={mesReclamado}
              onChange={(e) => {
                setMesReclamado(e.target.value);
                const inv = clientInvoices.find((i) => i.mes === e.target.value);
                if (inv) setValorFacturado(inv.valorTotal);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              {['Octubre 2026', 'Septiembre 2026', 'Agosto 2026', 'Julio 2026', 'Junio 2026', 'Mayo 2026'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {/* 11 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">11. Valor facturado (COP) *</label>
            <input
              type="number"
              required
              min={1000}
              value={valorFacturado}
              onChange={(e) => setValorFacturado(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
          {/* 12 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">12. Valor reclamado (COP) *</label>
            <input
              type="number"
              required
              min={1000}
              value={valorReclamado}
              onChange={(e) => setValorReclamado(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>
        </div>

        {/* Campos específicos según motivo */}
        {tipoInconformidad === 'Reconexión cobrada tras pago' && (
          <div className="rounded-2xl bg-[#F5F8FA] border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de pago (dd/mm/aaaa)</label>
              <input
                type="text"
                value={fechaPagoRealizado}
                onChange={(e) => setFechaPagoRealizado(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Referencia comprobante</label>
              <input
                type="text"
                value={referenciaComprobante}
                onChange={(e) => setReferenciaComprobante(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold">
                <Upload className="w-3.5 h-3.5" />
                Subir soporte
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('receipt', e.target.files?.[0])} />
              </label>
              <button
                type="button"
                onClick={() => handleSimulateAttachment('receipt')}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#003B5C] text-white font-bold"
              >
                <FileSearch className="w-3.5 h-3.5" />
                Simular OCR pago
              </button>
            </div>
            {comprobantePreview && (
              <img src={comprobantePreview} alt="Vista previa comprobante" className="sm:col-span-3 max-h-44 rounded-xl border border-slate-200" />
            )}
          </div>
        )}

        {tipoInconformidad === 'Lectura errónea' && (
          <div className="rounded-2xl bg-[#F5F8FA] border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lectura observada en tu medidor</label>
              <input
                type="number"
                value={lecturaReportada}
                onChange={(e) => setLecturaReportada(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold">
                <Upload className="w-3.5 h-3.5" />
                Subir foto medidor
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('meter', e.target.files?.[0])} />
              </label>
              <button
                type="button"
                onClick={() => handleSimulateAttachment('meter')}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#003B5C] text-white font-bold"
              >
                <FileSearch className="w-3.5 h-3.5" />
                Simular foto OCR
              </button>
            </div>
            {fotoMedidorPreview && (
              <img src={fotoMedidorPreview} alt="Vista previa foto medidor" className="sm:col-span-2 max-h-44 rounded-xl border border-slate-200" />
            )}
          </div>
        )}

        {/* 13 */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">13. Descripción de los hechos *</label>
          <textarea
            rows={3}
            required
            minLength={10}
            value={descripcionHechos}
            onChange={(e) => setDescripcionHechos(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
          />
        </div>

        {/* 14 + Consentimiento copia correo */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={autorizaDatos}
              onChange={(e) => setAutorizaDatos(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#00A859]"
            />
            <span>
              <strong>14. Autorización Ley 1581 de 2012 *:</strong> Autorizo el tratamiento de mis datos personales para la gestión y respuesta de esta PQR.
            </span>
          </label>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={autorizaCopiaCorreo}
              onChange={(e) => setAutorizaCopiaCorreo(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#EA4B71]"
            />
            <span>
              Autorizo el envío de una copia de mi solicitud (PDF) al correo <strong>{correoCliente}</strong> (opcional).
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white font-bold text-sm shadow-md"
        >
          <Send className="w-4 h-4" />
          Radicar solicitud y validar automáticamente
        </button>
      </form>
    </div>
  );
};
