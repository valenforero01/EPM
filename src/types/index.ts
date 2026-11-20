export type ServiceType = 'Energía' | 'Acueducto' | 'Gas';
export type MeterType = 'Convencional' | 'Inteligente AMI';
export type ContactChannel = 'WhatsApp' | 'Correo electrónico' | 'Teléfono';
export type DocumentType = 'CC' | 'CE' | 'NIT' | 'Pasaporte';

export interface Client {
  id: string;
  nombreCompleto: string;
  tipoDocumento: DocumentType;
  numeroDocumento: string;
  numeroContrato: string; // 7 dígitos
  servicio: ServiceType;
  direccion: string;
  barrio: string;
  municipio: string;
  estrato: 1 | 2 | 3 | 4 | 5 | 6;
  correo: string; // @ejemplo.co
  celular: string;
  tipoMedidor: MeterType;
  canalPreferido: ContactChannel;
  fechaVinculacion: string; // dd/mm/aaaa
}

export interface InvoiceExtraCharge {
  concepto: string;
  valor: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  mes: string; // Mayo 2026 .. Octubre 2026
  mesIndex: number; // 1 .. 6
  lecturaAnterior: number;
  lecturaActual: number;
  consumo: number;
  unidad: 'kWh' | 'm³';
  tarifaUnitaria: number;
  valorConsumo: number;
  cargoFijo: number;
  cobrosAdicionales: InvoiceExtraCharge[];
  valorTotal: number;
  fechaEmision: string; // dd/mm/aaaa
  fechaVencimiento: string; // dd/mm/aaaa
  fechaCorte: string; // 3 días hábiles después del vencimiento
  fechaPago?: string; // dd/mm/aaaa
  estado: 'Pagada' | 'Pendiente' | 'Vencida';
  referenciaPago?: string;
  observacionesCobro?: string;
}

export type PQRStatus =
  | 'Radicada'
  | 'En validación'
  | 'En validación AMI'
  | 'Visita técnica'
  | 'Análisis'
  | 'Procedente'
  | 'No procedente'
  | 'Pendiente de aprobación'
  | 'Cerrada';

export type KanbanColumn =
  | 'Radicada'
  | 'En validación'
  | 'Visita técnica'
  | 'Análisis'
  | 'Resuelta'
  | 'Cerrada';

export type PQRDisputeType =
  | 'Reconexión cobrada tras pago'
  | 'Lectura errónea'
  | 'Tarifa de medidor/contador'
  | 'Otro';

export interface TimelineEvent {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // dd/mm/aaaa HH:mm
  actor: string;
  tipo: 'radicacion' | 'ocr' | 'recaudo' | 'brms' | 'ami' | 'visita' | 'analisis' | 'resolucion' | 'notificacion' | 'correo' | 'cierre';
  estado: 'completado' | 'en_progreso' | 'alerta';
}

export interface ClientMessage {
  id: string;
  autor: string;
  rol: 'EPM' | 'Cliente';
  texto: string;
  fecha: string;
}

export interface InternalNote {
  id: string;
  autor: string;
  texto: string;
  fecha: string;
}

export interface PQRRequest {
  id: string; // PQR-2026-00001
  clientId: string;
  nombreCliente: string;
  tipoDocumento: DocumentType;
  numeroDocumento: string;
  contrato: string;
  servicio: ServiceType;
  canalRadicacion: 'Portal Clientes' | 'Chatbot Epi' | 'Oficio EPM';
  canalContacto: ContactChannel;
  datoContacto: string;
  correoCliente: string;
  tipoInconformidad: PQRDisputeType;
  mesReclamado: string;
  valorFacturado: number;
  valorReclamado: number;
  valorAjustado: number;
  valorAPagar: number;
  fechaPagoRealizado?: string;
  referenciaComprobante?: string;
  lecturaReportada?: number;
  fotoMedidorUrl?: string;
  comprobantePagoUrl?: string;
  descripcionHechos: string;
  autorizaDatos: boolean;
  autorizaCopiaCorreo: boolean;
  estado: PQRStatus;
  fechaRadicacion: string; // dd/mm/aaaa
  fechaLimite: string; // 15 días hábiles
  fechaResolucion?: string;
  fechaCierre?: string;
  diasTranscurridosSLA: number;
  responsable: 'Automático STP' | 'Analista PQR' | 'Cuadrilla Técnica';
  analistaAsignado?: string;
  priorizada?: boolean;
  resultadoMotorReglas: {
    decision: string;
    reglaAplicada: string;
    justificacionTecnica: string;
    justificacionLegal: string;
    ajusteAplicado: number;
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
  };
  historialEventos: TimelineEvent[];
  mensajesCliente: ClientMessage[];
  notasInternas: InternalNote[];
}

export interface TechVisit {
  id: string;
  pqrId: string;
  clientId: string;
  nombreCliente: string;
  contrato: string;
  servicio: ServiceType;
  municipio: string;
  direccion: string;
  fecha: string; // dd/mm/aaaa
  franja: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00';
  cuadrilla: string;
  estado: 'Programada' | 'Reprogramada' | 'Realizada';
  informeTecnico?: {
    lecturaVerificada: number;
    selloIntacto: boolean;
    observaciones: string;
    fechaRegistro: string;
    tecnico: string;
  };
}

export interface RuleEngineConfig {
  toleranciaPorcentaje: number; // default 20
  diaAlertaTemprana: number; // default 8
  diaDictamenPreventivo: number; // default 13
  slaDiasHabiles: number; // default 15
  resolucionAutomaticaActiva: boolean; // default true
}

export interface AuditLogEntry {
  id: string;
  fecha: string; // dd/mm/aaaa HH:mm
  actor: string;
  rol: 'Administrador' | 'Cliente' | 'Sistema BRMS';
  accion: string;
  entidad: string;
  detalle: string;
}

export interface SentEmailEntry {
  id: string;
  fecha: string;
  radicado: string;
  destinatario: string;
  asunto: string;
  estadoEnvio: 'Enviado (n8n)' | 'Simulado' | 'Error';
  modo: 'CORS' | 'no-cors' | 'Simulación';
  htmlPreview: string;
}

export interface ClientNotification {
  id: string;
  clientId: string;
  pqrId?: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'respuesta' | 'alerta' | 'resolucion' | 'visita';
}

export interface ReferenceTariff {
  estrato: 1 | 2 | 3 | 4 | 5 | 6;
  energiaKwh: number;
  acueductoM3: number;
  gasM3: number;
  cargoFijoEnergia: number;
  cargoFijoAcueducto: number;
  cargoFijoGas: number;
}
