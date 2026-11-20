import {
  Client,
  Invoice,
  PQRDisputeType,
  PQRRequest,
  PQRStatus,
  RuleEngineConfig,
  TimelineEvent,
} from '../types';
import {
  addColombianBusinessDays,
  formatCOP,
  formatDateCO,
  formatDateTimeCO,
  generateRadicadoNumber,
  getNextBusinessDateCO,
  isDateBeforeOrEqualCO,
} from './formatters';

export const DEFAULT_RULE_CONFIG: RuleEngineConfig = {
  toleranciaPorcentaje: 20,
  diaAlertaTemprana: 8,
  diaDictamenPreventivo: 13,
  slaDiasHabiles: 15,
  resolucionAutomaticaActiva: true,
};

export interface BRMSOutcome {
  estado: PQRStatus;
  responsable: PQRRequest['responsable'];
  valorAjustado: number;
  valorAPagar: number;
  reglaAplicada: string;
  decision: string;
  justificacionTecnica: string;
  justificacionLegal: string;
  notaCreditoGenerada?: string;
  ordenCorteCancelada?: boolean;
  amiLecturaRemota?: {
    lecturaAMI: number;
    fechaLectura: string;
    discrepanciaPorcentaje: number;
  };
  visitaAgendada?: {
    fecha: string;
    franja: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00';
    direccion: string;
    cuadrilla: string;
    estadoVisita: 'Programada' | 'Reprogramada' | 'Realizada';
  };
  timelineEvents: TimelineEvent[];
}

/**
 * Motor de Reglas BRMS EPM (Reglas R1 a R5)
 */
export function evaluateBRMS(params: {
  client: Client;
  invoice?: Invoice;
  clientInvoices: Invoice[];
  tipoInconformidad: PQRDisputeType;
  valorFacturado: number;
  valorReclamado: number;
  fechaPagoRealizado?: string;
  referenciaComprobante?: string;
  lecturaReportada?: number;
  descripcionHechos: string;
  config: RuleEngineConfig;
  visitDateOverride?: string;
  visitSlotOverride?: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00';
}): BRMSOutcome {
  const {
    client,
    invoice,
    clientInvoices,
    tipoInconformidad,
    valorFacturado,
    valorReclamado,
    fechaPagoRealizado,
    referenciaComprobante,
    lecturaReportada,
    config,
    visitDateOverride,
    visitSlotOverride,
  } = params;

  const nowStr = formatDateTimeCO(new Date());
  const baseEvents: TimelineEvent[] = [
    {
      id: `EV-RAD-${Date.now()}`,
      titulo: 'Radicación de Solicitud',
      descripcion: `Ingreso validado para el contrato ${client.numeroContrato} (${client.servicio}).`,
      fecha: nowStr,
      actor: client.nombreCompleto,
      tipo: 'radicacion',
      estado: 'completado',
    },
    {
      id: `EV-OCR-${Date.now() + 1}`,
      titulo: 'Extracción OCR Documental',
      descripcion: referenciaComprobante
        ? `OCR validó comprobante ref. ${referenciaComprobante} con fecha ${fechaPagoRealizado || 'oportuna'}.`
        : lecturaReportada
        ? `OCR extrajo lectura ${lecturaReportada} ${invoice?.unidad || 'kWh'} desde la evidencia fotográfica.`
        : 'Soportes digitales indexados en expediente electrónico.',
      fecha: nowStr,
      actor: 'Motor OCR EPM',
      tipo: 'ocr',
      estado: 'completado',
    },
    {
      id: `EV-API-${Date.now() + 2}`,
      titulo: 'Consulta API Recaudo e Histórico',
      descripcion: 'Cruce con pasarela de pagos (PSE/ACH/Bancos) e historial de consumo de los otros 5 meses.',
      fecha: nowStr,
      actor: 'Integración ERP / Recaudo',
      tipo: 'recaudo',
      estado: 'completado',
    },
  ];

  // R1: Reconexión cobrada tras pago
  if (tipoInconformidad === 'Reconexión cobrada tras pago') {
    const fechaCorte = invoice?.fechaCorte || '21/10/2026';
    const fechaPago = fechaPagoRealizado || invoice?.fechaPago;
    const paidBeforeCutoff = Boolean(fechaPago && isDateBeforeOrEqualCO(fechaPago, fechaCorte));

    if (paidBeforeCutoff) {
      const ncNumber = `NC-2026-${Math.floor(82000 + Math.random() * 17000)}`;
      const adjusted = Math.min(valorFacturado, valorReclamado);
      const pendingState: PQRStatus = config.resolucionAutomaticaActiva
        ? 'Procedente'
        : 'Pendiente de aprobación';

      return {
        estado: pendingState,
        responsable: config.resolucionAutomaticaActiva ? 'Automático STP' : 'Analista PQR',
        valorAjustado: adjusted,
        valorAPagar: Math.max(0, valorFacturado - adjusted),
        reglaAplicada: 'R1',
        decision: config.resolucionAutomaticaActiva
          ? 'PROCEDENTE – RESOLUCIÓN AUTOMÁTICA INMEDIATA (STP)'
          : 'PROCEDENTE – PENDIENTE DE APROBACIÓN HUMANA',
        justificacionTecnica: `La pasarela de recaudo confirmó el pago el ${fechaPago}, antes de la fecha de corte (${fechaCorte}). Se genera nota crédito por ${formatCOP(adjusted)} y se cancela cualquier orden de suspensión.`,
        justificacionLegal:
          'Artículo 142 de la Ley 142 de 1994 y Resolución CREG 108 de 1997: No procede el cobro de reconexión sin suspensión atribuible a mora.',
        notaCreditoGenerada: config.resolucionAutomaticaActiva ? ncNumber : undefined,
        ordenCorteCancelada: true,
        timelineEvents: [
          ...baseEvents,
          {
            id: `EV-BRMS-${Date.now() + 3}`,
            titulo: 'Evaluación BRMS (Regla R1)',
            descripcion: config.resolucionAutomaticaActiva
              ? `Resolución automática STP: Nota Crédito ${ncNumber} por ${formatCOP(adjusted)} y orden de corte anulada.`
              : `Regla R1 favorable; enviada a bandeja de aprobación por configuración de control manual.`,
            fecha: nowStr,
            actor: 'Motor BRMS EPM',
            tipo: 'resolucion',
            estado: config.resolucionAutomaticaActiva ? 'completado' : 'en_progreso',
          },
        ],
      };
    }

    return {
      estado: 'No procedente',
      responsable: 'Automático STP',
      valorAjustado: 0,
      valorAPagar: valorFacturado,
      reglaAplicada: 'R1',
      decision: 'NO PROCEDENTE – PAGO POSTERIOR A LA FECHA DE CORTE',
      justificacionTecnica: `El pago reportado (${fechaPago || 'sin fecha válida'}) se registró después de la fecha de corte (${fechaCorte}). La orden de suspensión/reconexión fue ejecutada conforme al ciclo operativo.`,
      justificacionLegal:
        'Artículo 96 de la Ley 142 de 1994: Quien incurre en mora asume los costos operativos de suspensión y reconexión.',
      timelineEvents: [
        ...baseEvents,
        {
          id: `EV-BRMS-${Date.now() + 3}`,
          titulo: 'Evaluación BRMS (Regla R1)',
          descripcion: `No procedente: pago posterior al corte (${fechaCorte}). Valor a pagar ratificado: ${formatCOP(valorFacturado)}.`,
          fecha: nowStr,
          actor: 'Motor BRMS EPM',
          tipo: 'resolucion',
          estado: 'completado',
        },
      ],
    };
  }

  // R2, R3, R4: Lectura errónea
  if (tipoInconformidad === 'Lectura errónea') {
    const otherInvoices = invoice
      ? clientInvoices.filter((i) => i.id !== invoice.id)
      : clientInvoices.slice(0, 5);
    const avg5 =
      otherInvoices.length > 0
        ? otherInvoices.reduce((acc, i) => acc + i.consumo, 0) / otherInvoices.length
        : invoice?.consumo || 100;

    // Si el cliente reportó una lectura, estimamos consumo reportado vs facturado o comparamos facturado vs promedio 5 meses
    const billedConsumption = invoice?.consumo || 100;
    const reportedConsumption =
      lecturaReportada && invoice && lecturaReportada >= invoice.lecturaAnterior
        ? lecturaReportada - invoice.lecturaAnterior
        : billedConsumption;

    const deviationBilled = ((billedConsumption - avg5) / avg5) * 100;
    const hasReadingMismatch =
      lecturaReportada !== undefined &&
      invoice !== undefined &&
      Math.abs(reportedConsumption - billedConsumption) / Math.max(1, billedConsumption) * 100 >
        config.toleranciaPorcentaje;

    const outsideTolerance =
      Math.abs(deviationBilled) > config.toleranciaPorcentaje || hasReadingMismatch;

    // R2: Dentro de tolerancia ±toleranciaPorcentaje%
    if (!outsideTolerance) {
      return {
        estado: 'No procedente',
        responsable: 'Automático STP',
        valorAjustado: 0,
        valorAPagar: valorFacturado,
        reglaAplicada: 'R2',
        decision: `NO PROCEDENTE – CONSUMO DENTRO DE TOLERANCIA (±${config.toleranciaPorcentaje} %)`,
        justificacionTecnica: `El consumo facturado (${billedConsumption} ${invoice?.unidad || 'kWh'}) presenta una desviación del ${deviationBilled >= 0 ? '+' : ''}${deviationBilled.toFixed(1)} % frente al promedio de los otros 5 meses (${avg5.toFixed(1)} ${invoice?.unidad || 'kWh'}), dentro del margen permitido de ±${config.toleranciaPorcentaje} %.`,
        justificacionLegal:
          'Artículo 146 de la Ley 142 de 1994 y Resolución CREG 108 de 1997 sobre medición y consumos ordinarios.',
        timelineEvents: [
          ...baseEvents,
          {
            id: `EV-BRMS-${Date.now() + 3}`,
            titulo: 'Evaluación BRMS (Regla R2)',
            descripcion: `Consumo validado estadísticamente dentro de ±${config.toleranciaPorcentaje} %. Valor a pagar: ${formatCOP(valorFacturado)}.`,
            fecha: nowStr,
            actor: 'Motor BRMS EPM',
            tipo: 'resolucion',
            estado: 'completado',
          },
        ],
      };
    }

    // R3: Fuera de tolerancia y medidor AMI
    if (client.tipoMedidor === 'Inteligente AMI') {
      const amiVal = lecturaReportada || (invoice ? invoice.lecturaActual - Math.round(billedConsumption * 0.3) : 4500);
      return {
        estado: 'En validación AMI',
        responsable: 'Automático STP',
        valorAjustado: 0,
        valorAPagar: valorFacturado,
        reglaAplicada: 'R3',
        decision: 'EN VALIDACIÓN TELEMÉTRICA REMOTA (MEDIDOR INTELIGENTE AMI)',
        justificacionTecnica: `Desviación detectada superior a ±${config.toleranciaPorcentaje} %. El predio cuenta con medidor AMI; se activó consulta remota bidireccional sin requerir desplazamiento de cuadrilla.`,
        justificacionLegal:
          'Resolución CREG 038 de 2014 – Código de Medida para Infraestructura de Medición Avanzada.',
        amiLecturaRemota: {
          lecturaAMI: amiVal,
          fechaLectura: nowStr,
          discrepanciaPorcentaje: Number(deviationBilled.toFixed(1)),
        },
        timelineEvents: [
          ...baseEvents,
          {
            id: `EV-BRMS-${Date.now() + 3}`,
            titulo: 'Interrogación Remota AMI (Regla R3)',
            descripcion: 'Solicitud enviada al concentrador AMI para descarga de curvas de carga y re-evaluación automática.',
            fecha: nowStr,
            actor: 'Sistema AMI EPM',
            tipo: 'ami',
            estado: 'en_progreso',
          },
        ],
      };
    }

    // R4: Fuera de tolerancia y medidor Convencional -> Visita técnica
    const vDate = visitDateOverride || getNextBusinessDateCO(2);
    const vSlot = visitSlotOverride || 'Mañana 08:00–12:00';
    return {
      estado: 'Visita técnica',
      responsable: 'Cuadrilla Técnica',
      valorAjustado: 0,
      valorAPagar: valorFacturado,
      reglaAplicada: 'R4',
      decision: 'VISITA TÉCNICA AGENDADA (MEDIDOR CONVENCIONAL)',
      justificacionTecnica: `Desviación superior a ±${config.toleranciaPorcentaje} % en medidor convencional. Se programa inspección técnica en predio para el ${vDate} (${vSlot}).`,
      justificacionLegal:
        'Artículo 145 de la Ley 142 de 1994: Derecho del usuario a verificación técnica conjunta del medidor.',
      visitaAgendada: {
        fecha: vDate,
        franja: vSlot,
        direccion: `${client.direccion}, ${client.barrio}, ${client.municipio}`,
        cuadrilla: 'Cuadrilla Central Valle de Aburrá',
        estadoVisita: 'Programada',
      },
      timelineEvents: [
        ...baseEvents,
        {
          id: `EV-BRMS-${Date.now() + 3}`,
          titulo: 'Agendamiento de Visita Técnica (Regla R4)',
          descripcion: `Visita programada para el ${vDate} en franja ${vSlot}.`,
          fecha: nowStr,
          actor: 'Despacho de Cuadrillas',
          tipo: 'visita',
          estado: 'en_progreso',
        },
      ],
    };
  }

  // R5: Tarifa de medidor / Otro o casos no tipificados -> Análisis humano (salvo AMI bajo garantía)
  if (tipoInconformidad === 'Tarifa de medidor/contador' && client.tipoMedidor === 'Inteligente AMI') {
    const ncNumber = `NC-2026-${Math.floor(85000 + Math.random() * 14000)}`;
    const adjusted = Math.min(valorFacturado, valorReclamado);
    const state: PQRStatus = config.resolucionAutomaticaActiva ? 'Procedente' : 'Pendiente de aprobación';
    return {
      estado: state,
      responsable: config.resolucionAutomaticaActiva ? 'Automático STP' : 'Analista PQR',
      valorAjustado: adjusted,
      valorAPagar: Math.max(0, valorFacturado - adjusted),
      reglaAplicada: 'R1',
      decision: config.resolucionAutomaticaActiva
        ? 'PROCEDENTE – MEDIDOR AMI BAJO GARANTÍA TÉCNICA'
        : 'PROCEDENTE – PENDIENTE DE APROBACIÓN',
      justificacionTecnica: `El medidor AMI del contrato cuenta con garantía técnica vigente. Se reversa el cargo por ${formatCOP(adjusted)}.`,
      justificacionLegal: 'Resolución CREG 038 de 2014 e ISO/IEC 17025.',
      notaCreditoGenerada: config.resolucionAutomaticaActiva ? ncNumber : undefined,
      timelineEvents: [
        ...baseEvents,
        {
          id: `EV-BRMS-${Date.now() + 3}`,
          titulo: 'Validación de Garantía AMI',
          descripcion: `Cargo improcedente reversado (${formatCOP(adjusted)}).`,
          fecha: nowStr,
          actor: 'Motor BRMS EPM',
          tipo: 'resolucion',
          estado: config.resolucionAutomaticaActiva ? 'completado' : 'en_progreso',
        },
      ],
    };
  }

  // R5 por defecto: Análisis de analista
  return {
    estado: 'Análisis',
    responsable: 'Analista PQR',
    valorAjustado: 0,
    valorAPagar: valorFacturado,
    reglaAplicada: 'R5',
    decision: 'ESCALADA A ANÁLISIS DE ANALISTA ESPECIALIZADO',
    justificacionTecnica:
      'El caso requiere revisión documental detallada por parte de un analista PQR con control preventivo del SLA.',
    justificacionLegal:
      'Artículos 154 y 158 de la Ley 142 de 1994 (Debida motivación y término de 15 días hábiles).',
    timelineEvents: [
      ...baseEvents,
      {
        id: `EV-BRMS-${Date.now() + 3}`,
        titulo: 'Asignación a Analista (Regla R5)',
        descripcion: 'Caso enviado a mesa de análisis con seguimiento preventivo SLA.',
        fecha: nowStr,
        actor: 'Motor BRMS EPM',
        tipo: 'analisis',
        estado: 'en_progreso',
      },
    ],
  };
}

export function buildNewPQRRequest(params: {
  existingIds: string[];
  client: Client;
  invoice?: Invoice;
  clientInvoices: Invoice[];
  tipoInconformidad: PQRDisputeType;
  valorFacturado: number;
  valorReclamado: number;
  fechaPagoRealizado?: string;
  referenciaComprobante?: string;
  lecturaReportada?: number;
  fotoMedidorUrl?: string;
  comprobantePagoUrl?: string;
  descripcionHechos: string;
  autorizaCopiaCorreo: boolean;
  canalRadicacion: PQRRequest['canalRadicacion'];
  config: RuleEngineConfig;
  visitDateOverride?: string;
  visitSlotOverride?: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00';
}): PQRRequest {
  const radicado = generateRadicadoNumber(params.existingIds);
  const now = new Date();
  const fechaRadicacion = formatDateCO(now);
  const fechaLimite = addColombianBusinessDays(now, params.config.slaDiasHabiles);

  const outcome = evaluateBRMS({
    client: params.client,
    invoice: params.invoice,
    clientInvoices: params.clientInvoices,
    tipoInconformidad: params.tipoInconformidad,
    valorFacturado: params.valorFacturado,
    valorReclamado: params.valorReclamado,
    fechaPagoRealizado: params.fechaPagoRealizado,
    referenciaComprobante: params.referenciaComprobante,
    lecturaReportada: params.lecturaReportada,
    descripcionHechos: params.descripcionHechos,
    config: params.config,
    visitDateOverride: params.visitDateOverride,
    visitSlotOverride: params.visitSlotOverride,
  });

  return {
    id: radicado,
    clientId: params.client.id,
    nombreCliente: params.client.nombreCompleto,
    tipoDocumento: params.client.tipoDocumento,
    numeroDocumento: params.client.numeroDocumento,
    contrato: params.client.numeroContrato,
    servicio: params.client.servicio,
    canalRadicacion: params.canalRadicacion,
    canalContacto: params.client.canalPreferido,
    datoContacto:
      params.client.canalPreferido === 'Correo electrónico'
        ? params.client.correo
        : params.client.celular,
    correoCliente: params.client.correo,
    tipoInconformidad: params.tipoInconformidad,
    mesReclamado: params.invoice?.mes || 'Octubre 2026',
    valorFacturado: params.valorFacturado,
    valorReclamado: params.valorReclamado,
    valorAjustado: outcome.valorAjustado,
    valorAPagar: outcome.valorAPagar,
    fechaPagoRealizado: params.fechaPagoRealizado,
    referenciaComprobante: params.referenciaComprobante,
    lecturaReportada: params.lecturaReportada,
    fotoMedidorUrl: params.fotoMedidorUrl,
    comprobantePagoUrl: params.comprobantePagoUrl,
    descripcionHechos: params.descripcionHechos,
    autorizaDatos: true,
    autorizaCopiaCorreo: params.autorizaCopiaCorreo,
    estado: outcome.estado,
    fechaRadicacion,
    fechaLimite,
    fechaResolucion:
      outcome.estado === 'Procedente' || outcome.estado === 'No procedente'
        ? fechaRadicacion
        : undefined,
    diasTranscurridosSLA: 1,
    responsable: outcome.responsable,
    resultadoMotorReglas: {
      decision: outcome.decision,
      reglaAplicada: outcome.reglaAplicada,
      justificacionTecnica: outcome.justificacionTecnica,
      justificacionLegal: outcome.justificacionLegal,
      ajusteAplicado: outcome.valorAjustado,
      notaCreditoGenerada: outcome.notaCreditoGenerada,
      ordenCorteCancelada: outcome.ordenCorteCancelada,
      amiLecturaRemota: outcome.amiLecturaRemota,
      visitaAgendada: outcome.visitaAgendada,
    },
    historialEventos: outcome.timelineEvents,
    mensajesCliente: [],
    notasInternas: [],
  };
}
