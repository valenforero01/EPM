import {
  Client,
  Invoice,
  PQRRequest,
  PQRStatus,
  PQRDisputeType,
  TechVisit,
  AuditLogEntry,
  ClientNotification,
  SentEmailEntry,
  ReferenceTariff,
  ServiceType,
  ContactChannel,
} from '../types';
import { addColombianBusinessDays, formatDateCO } from '../utils/formatters';

// Semilla fija para generación determinística reproducible
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20261114);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export const REFERENCE_TARIFFS: ReferenceTariff[] = [
  { estrato: 1, energiaKwh: 398, acueductoM3: 1890, gasM3: 1420, cargoFijoEnergia: 7200, cargoFijoAcueducto: 8400, cargoFijoGas: 4900 },
  { estrato: 2, energiaKwh: 495, acueductoM3: 2450, gasM3: 1680, cargoFijoEnergia: 9100, cargoFijoAcueducto: 10600, cargoFijoGas: 6200 },
  { estrato: 3, energiaKwh: 685, acueductoM3: 3320, gasM3: 1990, cargoFijoEnergia: 12400, cargoFijoAcueducto: 14200, cargoFijoGas: 8100 },
  { estrato: 4, energiaKwh: 815, acueductoM3: 3920, gasM3: 2210, cargoFijoEnergia: 14800, cargoFijoAcueducto: 17100, cargoFijoGas: 9500 },
  { estrato: 5, energiaKwh: 978, acueductoM3: 4710, gasM3: 2650, cargoFijoEnergia: 17800, cargoFijoAcueducto: 20500, cargoFijoGas: 11400 },
  { estrato: 6, energiaKwh: 1010, acueductoM3: 4980, gasM3: 2790, cargoFijoEnergia: 18500, cargoFijoAcueducto: 21800, cargoFijoGas: 12100 },
];

const FIRST_NAMES = [
  'Mariana', 'Carlos Andrés', 'Valentina', 'Juan Fernando', 'Sofía', 'Mateo',
  'Camila', 'Santiago', 'Daniela', 'Alejandro', 'Lucía', 'Andrés Felipe',
  'Isabella', 'Julián David', 'Natalia', 'Gustavo Adolfo', 'Paola Andrea', 'Sebastián',
  'Manuela', 'Felipe', 'Laura', 'Esteban', 'Carolina', 'Tomás', 'Juliana',
  'Ricardo', 'Catalina', 'Nicolás', 'María José', 'Diego',
];

const LAST_NAMES = [
  'Restrepo Gómez', 'Montoya Cadavid', 'Henao Zapata', 'Uribe Vélez', 'Morales Botero',
  'Echeverri Londoño', 'Jaramillo Arango', 'Quintero Muñoz', 'Betancur Osorio', 'Giraldo Cano',
  'Fernández Castaño', 'Cardona Ruiz', 'Álvarez Tamayo', 'Ospina Gómez', 'Villegas Correa',
  'Rúa Peña', 'Marín Gil', 'Cano Agudelo', 'Posada Saldarriaga', 'Gómez Arismendi',
  'Mejía Vélez', 'Mesa Bedoya', 'Patiño Palacio', 'Salazar Toro', 'Vásquez Hoyos',
  'Hincapié Ríos', 'Berrío Sierra', 'Rendón Tobón', 'Castrillón Alzate', 'Acevedo Monsalve',
];

interface LocationSeed {
  municipio: string;
  barrio: string;
  estrato: 1 | 2 | 3 | 4 | 5 | 6;
  via: string;
}

const LOCATIONS: LocationSeed[] = [
  { municipio: 'Medellín', barrio: 'Laureles', estrato: 4, via: 'Carrera 76 #32EE-14' },
  { municipio: 'Medellín', barrio: 'El Poblado', estrato: 6, via: 'Calle 10 Sur #43A-65' },
  { municipio: 'Medellín', barrio: 'Conquistadores', estrato: 4, via: 'Circular 4 #71-55' },
  { municipio: 'Medellín', barrio: 'Calasanz', estrato: 3, via: 'Carrera 80 #48B-22' },
  { municipio: 'Medellín', barrio: 'Boston', estrato: 3, via: 'Calle 52 #39-18' },
  { municipio: 'Envigado', barrio: 'La Magnolia', estrato: 4, via: 'Diagonal 31D #28Sur-45' },
  { municipio: 'Bello', barrio: 'Niquía', estrato: 2, via: 'Calle 38 #55-12' },
  { municipio: 'Itagüí', barrio: 'Santa María', estrato: 3, via: 'Carrera 42 #60-31' },
  { municipio: 'Medellín', barrio: 'Manrique Central', estrato: 2, via: 'Calle 67 #45-90' },
  { municipio: 'Medellín', barrio: 'Castilla', estrato: 2, via: 'Carrera 65 #98-12' },
  { municipio: 'Sabaneta', barrio: 'Mayorca', estrato: 4, via: 'Calle 75 Sur #45-20' },
  { municipio: 'Medellín', barrio: 'Belén San Bernardo', estrato: 3, via: 'Calle 30A #80-15' },
  { municipio: 'Medellín', barrio: 'Ciudad del Río', estrato: 5, via: 'Carrera 48 #18A-22' },
  { municipio: 'Medellín', barrio: 'Robledo Pilarica', estrato: 3, via: 'Calle 65 #87-40' },
  { municipio: 'Medellín', barrio: 'Provenza', estrato: 6, via: 'Carrera 35 #7-45' },
  { municipio: 'Medellín', barrio: 'Tricentenario', estrato: 2, via: 'Calle 104 #72-30' },
  { municipio: 'Medellín', barrio: 'Suramericana', estrato: 4, via: 'Calle 50 #64C-25' },
  { municipio: 'Medellín', barrio: 'La 70', estrato: 4, via: 'Transversal 39B #73-10' },
  { municipio: 'Medellín', barrio: 'Las Lomas', estrato: 5, via: 'Calle 14 #30-120' },
  { municipio: 'Medellín', barrio: 'Prado Centro', estrato: 3, via: 'Carrera 51D #65-30' },
  { municipio: 'La Estrella', barrio: 'Pueblo Viejo', estrato: 3, via: 'Carrera 60 #82Sur-18' },
  { municipio: 'Copacabana', barrio: 'Machado', estrato: 2, via: 'Calle 49 #50-24' },
  { municipio: 'Caldas', barrio: 'La Valeria', estrato: 2, via: 'Carrera 49 #132Sur-10' },
  { municipio: 'Girardota', barrio: 'San Esteban', estrato: 2, via: 'Calle 6 #14-35' },
  { municipio: 'Medellín', barrio: 'Santo Domingo Savio', estrato: 1, via: 'Carrera 31 #105-22' },
  { municipio: 'Medellín', barrio: 'Popular 1', estrato: 1, via: 'Calle 107 #42B-19' },
  { municipio: 'Envigado', barrio: 'Zúñiga', estrato: 5, via: 'Calle 21 Sur #43-80' },
  { municipio: 'Sabaneta', barrio: 'Aves María', estrato: 4, via: 'Carrera 43A #72Sur-54' },
  { municipio: 'Itagüí', barrio: 'Ditaires', estrato: 3, via: 'Calle 36 #59-14' },
  { municipio: 'Bello', barrio: 'Cabañas', estrato: 3, via: 'Diagonal 52 #31-40' },
];

const SERVICES: ServiceType[] = ['Energía', 'Acueducto', 'Gas'];
const CHANNELS: ContactChannel[] = ['WhatsApp', 'Correo electrónico', 'Teléfono'];

function normalizeEmailPart(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

// ==========================================
// 1. GENERACIÓN DE 60 CLIENTES
// ==========================================
export const MOCK_CLIENTS: Client[] = Array.from({ length: 60 }, (_, idx) => {
  const first = FIRST_NAMES[idx % FIRST_NAMES.length];
  const last = LAST_NAMES[(idx * 7 + 3) % LAST_NAMES.length];
  const nombreCompleto = `${first} ${last}`;
  const loc = LOCATIONS[idx % LOCATIONS.length];
  const docNum = String(1015200000 + idx * 14789 + Math.floor(rng() * 500));
  const contractNum = String(2048912 + idx * 13107).slice(0, 7);
  const servicio = idx === 0 ? 'Energía' : idx === 2 ? 'Acueducto' : idx === 3 ? 'Gas' : SERVICES[idx % 3];
  const tipoMedidor = idx === 0 || idx === 5 ? 'Inteligente AMI' : idx === 2 ? 'Convencional' : rng() > 0.48 ? 'Inteligente AMI' : 'Convencional';
  const emailSlug = normalizeEmailPart(`${first.split(' ')[0]}.${last.split(' ')[0]}${idx > 29 ? idx : ''}`);
  const cel = `+57 3${10 + (idx % 12)} ${String(410 + idx * 7).slice(0, 3)} ${String(1020 + idx * 113).slice(0, 4)}`;
  const regYear = 2018 + (idx % 8);
  const regMonth = String(1 + (idx % 12)).padStart(2, '0');
  const regDay = String(1 + ((idx * 3) % 27)).padStart(2, '0');

  return {
    id: `CLI-${String(idx + 1).padStart(3, '0')}`,
    nombreCompleto,
    tipoDocumento: 'CC',
    numeroDocumento: docNum,
    numeroContrato: contractNum,
    servicio,
    direccion: `${loc.via}, Apto ${101 + (idx % 8) * 100}`,
    barrio: loc.barrio,
    municipio: loc.municipio,
    estrato: loc.estrato,
    correo: `${emailSlug}@ejemplo.co`,
    celular: cel,
    tipoMedidor,
    canalPreferido: CHANNELS[idx % 3],
    fechaVinculacion: `${regDay}/${regMonth}/${regYear}`,
  };
});

// ==========================================
// 2. GENERACIÓN DE 360 FACTURAS (6 meses × 60 clientes)
// ==========================================
const MONTHS_CONFIG = [
  { mes: 'Mayo 2026', index: 1, emision: '02/05/2026', vencimiento: '18/05/2026' },
  { mes: 'Junio 2026', index: 2, emision: '02/06/2026', vencimiento: '18/06/2026' },
  { mes: 'Julio 2026', index: 3, emision: '02/07/2026', vencimiento: '18/07/2026' },
  { mes: 'Agosto 2026', index: 4, emision: '02/08/2026', vencimiento: '18/08/2026' },
  { mes: 'Septiembre 2026', index: 5, emision: '02/09/2026', vencimiento: '18/09/2026' },
  { mes: 'Octubre 2026', index: 6, emision: '02/10/2026', vencimiento: '18/10/2026' },
];

export const MOCK_INVOICES: Invoice[] = [];

// Índices de clientes con cobros sospechosos SIN solicitud (para panel /admin/facturacion)
const SUSPICIOUS_RECONNECTION_CLIENTS = new Set(['CLI-051', 'CLI-053', 'CLI-055', 'CLI-057']);
const SUSPICIOUS_READING_CLIENTS = new Set(['CLI-052', 'CLI-054', 'CLI-056']);

MOCK_CLIENTS.forEach((client, cIdx) => {
  const tariffRow = REFERENCE_TARIFFS.find((t) => t.estrato === client.estrato) || REFERENCE_TARIFFS[2];
  const unit = client.servicio === 'Energía' ? 'kWh' : 'm³';
  const unitRate =
    client.servicio === 'Energía'
      ? tariffRow.energiaKwh
      : client.servicio === 'Acueducto'
      ? tariffRow.acueductoM3
      : tariffRow.gasM3;
  const fixedFee =
    client.servicio === 'Energía'
      ? tariffRow.cargoFijoEnergia
      : client.servicio === 'Acueducto'
      ? tariffRow.cargoFijoAcueducto
      : tariffRow.cargoFijoGas;

  let baseReading = 3100 + cIdx * 185;

  MONTHS_CONFIG.forEach((m) => {
    const fechaCorte = addColombianBusinessDays(m.vencimiento, 3);
    let consumo =
      client.servicio === 'Energía'
        ? Math.round(125 + (cIdx % 6) * 14 + Math.sin(m.index + cIdx) * 8)
        : client.servicio === 'Acueducto'
        ? Math.round(11 + (cIdx % 4) * 2 + Math.cos(m.index) * 1.2)
        : Math.round(16 + (cIdx % 5) * 2 + Math.sin(m.index) * 1.5);

    const cobrosAdicionales: { concepto: string; valor: number }[] = [];
    let observaciones = '';

    // Casos específicos vinculados a PQRs existentes
    if (client.id === 'CLI-001' && m.index === 6) {
      cobrosAdicionales.push({ concepto: 'Reconexión del servicio', valor: 48300 });
      observaciones = 'Cargo de reconexión facturado pese a pago registrado antes de corte.';
    }
    if (client.id === 'CLI-003' && m.index === 5) {
      consumo = Math.round(consumo * 2.8);
      observaciones = 'Variación atípica de lectura superior a ±20 % frente al promedio histórico.';
    }
    if (client.id === 'CLI-006' && m.index === 6) {
      consumo = Math.round(consumo * 2.2);
      observaciones = 'Salto de consumo detectado en ciclo de facturación AMI.';
    }

    // 7 facturas sospechosas SIN PQR (para panel de Cobros Sospechosos)
    if (SUSPICIOUS_RECONNECTION_CLIENTS.has(client.id) && m.index === 6) {
      cobrosAdicionales.push({ concepto: 'Reconexión del servicio', valor: 48300 });
      observaciones = 'Cobro sospechoso: reconexión cargada teniendo pago previo al corte.';
    }
    if (SUSPICIOUS_READING_CLIENTS.has(client.id) && m.index === 6) {
      consumo = Math.round(consumo * 1.95);
      observaciones = 'Cobro sospechoso: lectura supera el umbral de ±20 % respecto a los otros 5 meses.';
    }

    const lecturaAnterior = baseReading;
    const lecturaActual = baseReading + consumo;
    baseReading = lecturaActual;

    const valorConsumo = Math.round(consumo * unitRate);
    const totalExtra = cobrosAdicionales.reduce((acc, c) => acc + c.valor, 0);
    const valorTotal = valorConsumo + fixedFee + totalExtra;

    let estado: 'Pagada' | 'Pendiente' | 'Vencida' = 'Pagada';
    let fechaPago: string | undefined = undefined;
    let referenciaPago: string | undefined = undefined;

    if (m.index <= 5) {
      estado = 'Pagada';
      const payDay = String(12 + (cIdx % 5)).padStart(2, '0');
      fechaPago = `${payDay}/0${m.index}/2026`;
      referenciaPago = `EPM-PSE-${m.index}${1000 + cIdx * 17}`;
    } else {
      // Octubre 2026
      if (client.id === 'CLI-001' || SUSPICIOUS_RECONNECTION_CLIENTS.has(client.id)) {
        estado = 'Pagada';
        fechaPago = '16/10/2026'; // Antes del vencimiento 18/10 y corte 21/10
        referenciaPago = `EPM-PSE-6${1100 + cIdx * 17}`;
      } else if (cIdx % 5 === 0) {
        estado = 'Pendiente';
      } else if (cIdx % 11 === 0) {
        estado = 'Vencida';
      } else {
        estado = 'Pagada';
        fechaPago = '17/10/2026';
        referenciaPago = `EPM-PSE-6${1000 + cIdx * 17}`;
      }
    }

    MOCK_INVOICES.push({
      id: `FAC-2026-0${m.index}-${client.numeroContrato.slice(-4)}`,
      clientId: client.id,
      mes: m.mes,
      mesIndex: m.index,
      lecturaAnterior,
      lecturaActual,
      consumo,
      unidad: unit,
      tarifaUnitaria: unitRate,
      valorConsumo,
      cargoFijo: fixedFee,
      cobrosAdicionales,
      valorTotal,
      fechaEmision: m.emision,
      fechaVencimiento: m.vencimiento,
      fechaCorte,
      fechaPago,
      estado,
      referenciaPago,
      observacionesCobro: observaciones || undefined,
    });
  });
});

// ==========================================
// 3. GENERACIÓN DE 45 SOLICITUDES PQR (Junio a Noviembre 2026)
// Distribución exacta: 15 Procedente, 9 No procedente, 6 Cerrada,
// 4 En validación AMI, 4 Visita técnica, 4 Análisis, 3 Radicada
// Con al menos 6 en riesgo de SLA (día 8+)
// ==========================================
const STATUS_QUOTA: PQRStatus[] = [
  ...Array(15).fill('Procedente'),
  ...Array(9).fill('No procedente'),
  ...Array(6).fill('Cerrada'),
  ...Array(4).fill('En validación AMI'),
  ...Array(4).fill('Visita técnica'),
  ...Array(4).fill('Análisis'),
  ...Array(3).fill('Radicada'),
];

const DISPUTE_TYPES: PQRDisputeType[] = [
  'Reconexión cobrada tras pago',
  'Lectura errónea',
  'Tarifa de medidor/contador',
  'Otro',
];

const FILING_DATES_POOL = [
  '12/06/2026', '24/06/2026', '08/07/2026', '21/07/2026', '05/08/2026',
  '19/08/2026', '03/09/2026', '17/09/2026', '05/10/2026', '14/10/2026',
  '22/10/2026', '28/10/2026', '02/11/2026', '06/11/2026', '11/11/2026',
];

export const INITIAL_PQR_REQUESTS: PQRRequest[] = STATUS_QUOTA.map((status, idx) => {
  // Asegurar que CLI-001 (Mariana), CLI-002, CLI-003, CLI-006 tengan solicitudes representativas
  const client = MOCK_CLIENTS[idx % 45];
  const clientInvoices = MOCK_INVOICES.filter((inv) => inv.clientId === client.id);
  const targetInv = clientInvoices[clientInvoices.length - 1];
  const radicado = `PQR-2026-${String(idx + 1).padStart(5, '0')}`;

  // Determinar tipo de inconformidad coherente con el estado
  let tipoInconformidad: PQRDisputeType = DISPUTE_TYPES[idx % 4];
  if (status === 'En validación AMI' || status === 'Visita técnica') {
    tipoInconformidad = 'Lectura errónea';
  } else if (status === 'Procedente' && idx % 2 === 0) {
    tipoInconformidad = 'Reconexión cobrada tras pago';
  }

  // Fecha de radicación (los últimos en oct-nov 2026)
  const fechaRadicacion =
    idx === 0
      ? '09/11/2026'
      : status === 'Radicada' || status === 'Análisis' || status === 'Visita técnica' || status === 'En validación AMI'
      ? FILING_DATES_POOL[9 + (idx % 6)]
      : FILING_DATES_POOL[idx % FILING_DATES_POOL.length];

  const fechaLimite = addColombianBusinessDays(fechaRadicacion, 15);

  // Asignar días SLA transcurridos (al menos 6 casos abiertos en día 8+!)
  let diasTranscurridosSLA = 2 + (idx % 5);
  if (status === 'Análisis') {
    diasTranscurridosSLA = idx % 2 === 0 ? 13 : 9; // Dictamen preventivo día 13 y alerta temprana día 9
  } else if (status === 'Visita técnica') {
    diasTranscurridosSLA = idx % 2 === 0 ? 10 : 8; // Alerta temprana día 8 y 10
  } else if (status === 'En validación AMI') {
    diasTranscurridosSLA = idx % 2 === 0 ? 8 : 4;
  } else if (status === 'Radicada') {
    diasTranscurridosSLA = idx % 2 === 0 ? 11 : 1;
  } else if (status === 'Cerrada') {
    diasTranscurridosSLA = 11;
  }

  const valorFacturado = targetInv ? targetInv.valorTotal : 148000;
  const valorReclamado =
    tipoInconformidad === 'Reconexión cobrada tras pago'
      ? 48300
      : tipoInconformidad === 'Tarifa de medidor/contador'
      ? 35000
      : Math.round(valorFacturado * 0.35);

  const isProcedente = status === 'Procedente' || (status === 'Cerrada' && idx % 2 === 0);
  const valorAjustado = isProcedente ? valorReclamado : 0;
  const valorAPagar = Math.max(0, valorFacturado - valorAjustado);

  const responsable: PQRRequest['responsable'] =
    status === 'Procedente' || status === 'No procedente' || status === 'En validación AMI'
      ? 'Automático STP'
      : status === 'Visita técnica'
      ? 'Cuadrilla Técnica'
      : 'Analista PQR';

  const ruleCode =
    tipoInconformidad === 'Reconexión cobrada tras pago'
      ? 'R1'
      : status === 'En validación AMI'
      ? 'R3'
      : status === 'Visita técnica'
      ? 'R4'
      : status === 'No procedente'
      ? 'R2'
      : 'R5';

  const decisionText =
    status === 'Procedente'
      ? 'PROCEDENTE – RESOLUCIÓN AUTOMÁTICA (STP)'
      : status === 'No procedente'
      ? 'NO PROCEDENTE – COBRO VALIDADO CONFORME A NORMATIVA'
      : status === 'En validación AMI'
      ? 'EN VALIDACIÓN TELEMÉTRICA REMOTA (AMI)'
      : status === 'Visita técnica'
      ? 'VISITA TÉCNICA DE CUADRILLA PROGRAMADA'
      : status === 'Análisis'
      ? 'EN ANÁLISIS ESPECIALIZADO DE ANALISTA'
      : status === 'Radicada'
      ? 'RADICADA – EN COLA DE VALIDACIÓN AUTOMÁTICA'
      : 'CERRADA CON RESOLUCIÓN NOTIFICADA';

  const notaCredito = isProcedente ? `NC-2026-${81000 + idx}` : undefined;
  const canEmail = idx % 5 !== 4; // 80% autorizó correo

  const visitaObj =
    status === 'Visita técnica'
      ? {
          fecha: formatDateCO(new Date(2026, 10, 18 + (idx % 4))),
          franja: (idx % 2 === 0 ? 'Mañana 08:00–12:00' : 'Tarde 13:00–17:00') as 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00',
          direccion: `${client.direccion}, ${client.barrio}, ${client.municipio}`,
          cuadrilla: `Cuadrilla Zona ${(idx % 4) + 1}`,
          estadoVisita: (idx % 3 === 0 ? 'Reprogramada' : 'Programada') as 'Programada' | 'Reprogramada' | 'Realizada',
        }
      : undefined;

  const amiObj =
    status === 'En validación AMI'
      ? {
          lecturaAMI: (targetInv?.lecturaActual || 4500) - 42,
          fechaLectura: `${fechaRadicacion} 10:15`,
          discrepanciaPorcentaje: -26.4,
        }
      : undefined;

  return {
    id: radicado,
    clientId: client.id,
    nombreCliente: client.nombreCompleto,
    tipoDocumento: client.tipoDocumento,
    numeroDocumento: client.numeroDocumento,
    contrato: client.numeroContrato,
    servicio: client.servicio,
    canalRadicacion: idx % 3 === 0 ? 'Chatbot Epi' : 'Portal Clientes',
    canalContacto: client.canalPreferido,
    datoContacto: client.canalPreferido === 'Correo electrónico' ? client.correo : client.celular,
    correoCliente: client.correo,
    tipoInconformidad,
    mesReclamado: targetInv?.mes || 'Octubre 2026',
    valorFacturado,
    valorReclamado,
    valorAjustado,
    valorAPagar,
    fechaPagoRealizado: tipoInconformidad === 'Reconexión cobrada tras pago' ? '16/10/2026' : undefined,
    referenciaComprobante: tipoInconformidad === 'Reconexión cobrada tras pago' ? `EPM-PSE-${61000 + idx}` : undefined,
    lecturaReportada: tipoInconformidad === 'Lectura errónea' ? (targetInv?.lecturaActual || 4800) - 35 : undefined,
    descripcionHechos:
      tipoInconformidad === 'Reconexión cobrada tras pago'
        ? 'Realicé el pago oportuno de mi factura antes de la fecha límite y sin embargo me facturaron cargo de reconexión del servicio.'
        : tipoInconformidad === 'Lectura errónea'
        ? 'El consumo facturado presenta un incremento superior al 20 % frente a mis meses anteriores sin cambios de ocupación.'
        : 'Solicito revisión del cargo adicional incluido en mi última factura por considerarlo improcedente.',
    autorizaDatos: true,
    autorizaCopiaCorreo: canEmail,
    estado: status,
    fechaRadicacion,
    fechaLimite,
    fechaResolucion: status === 'Procedente' || status === 'No procedente' || status === 'Cerrada' ? fechaRadicacion : undefined,
    fechaCierre: status === 'Cerrada' ? addColombianBusinessDays(fechaRadicacion, 4) : undefined,
    diasTranscurridosSLA,
    responsable,
    analistaAsignado: status === 'Análisis' ? (idx % 2 === 0 ? 'Laura Restrepo V.' : 'Andrés Mejía P.') : undefined,
    priorizada: diasTranscurridosSLA >= 13,
    resultadoMotorReglas: {
      decision: decisionText,
      reglaAplicada: ruleCode,
      justificacionTecnica:
        isProcedente
          ? 'Validación automática en pasarela de recaudo confirmó pago oportuno antes de la fecha de corte. Se emitió nota crédito inmediata y se anuló orden de suspensión.'
          : status === 'No procedente'
          ? 'El consumo facturado se ubica dentro de la tolerancia estadística (±20 %) frente al promedio de los 5 meses anteriores, o el pago fue posterior al corte.'
          : status === 'En validación AMI'
          ? 'Medidor inteligente AMI detectado; interrogación remota de curvas horarias en progreso para validar lectura exacta.'
          : status === 'Visita técnica'
          ? 'Discrepancia superior a ±20 % en medidor convencional. Cuadrilla técnica programada en predio según franja seleccionada.'
          : 'Caso escalado a mesa de análisis especializado con monitoreo preventivo del término legal de 15 días hábiles.',
      justificacionLegal: 'Ley 142 de 1994 (Arts. 96, 142, 145, 146, 154 y 158) y Resolución CREG 108 de 1997.',
      ajusteAplicado: valorAjustado,
      notaCreditoGenerada: notaCredito,
      ordenCorteCancelada: isProcedente,
      visitaAgendada: visitaObj,
      amiLecturaRemota: amiObj,
    },
    historialEventos: [
      {
        id: `EV-${idx}-1`,
        titulo: 'Radicación de Solicitud',
        descripcion: `Radicada bajo contrato ${client.numeroContrato} por ${tipoInconformidad}.`,
        fecha: `${fechaRadicacion} 09:15`,
        actor: client.nombreCompleto,
        tipo: 'radicacion',
        estado: 'completado',
      },
      {
        id: `EV-${idx}-2`,
        titulo: 'Extracción OCR y Consulta de Recaudo',
        descripcion: 'Cruce automatizado con pasarela de pagos y base histórica de consumos (6 meses).',
        fecha: `${fechaRadicacion} 09:16`,
        actor: 'Motor OCR / API Recaudo',
        tipo: 'ocr',
        estado: 'completado',
      },
      {
        id: `EV-${idx}-3`,
        titulo: `Evaluación BRMS Regla ${ruleCode}`,
        descripcion: decisionText,
        fecha: `${fechaRadicacion} 09:17`,
        actor: 'Motor BRMS EPM',
        tipo: 'brms',
        estado: status === 'Radicada' || status === 'Análisis' || status === 'Visita técnica' || status === 'En validación AMI' ? 'en_progreso' : 'completado',
      },
    ],
    mensajesCliente:
      status === 'Procedente'
        ? [
            {
              id: `MSG-${idx}-1`,
              autor: 'Sistema Automático EPM',
              rol: 'EPM',
              texto: `Tu solicitud ${radicado} fue resuelta favorablemente de manera automática. Nota crédito ${notaCredito} aplicada.`,
              fecha: `${fechaRadicacion} 09:18`,
            },
          ]
        : [],
    notasInternas:
      status === 'Análisis'
        ? [
            {
              id: `NOTE-${idx}-1`,
              autor: 'Laura Restrepo V. (Analista)',
              texto: 'Verificando conciliación bancaria nocturna y registro de cuadrilla en zona.',
              fecha: `${fechaRadicacion} 14:10`,
            },
          ]
        : [],
  };
});

// ==========================================
// 4. VISITAS TÉCNICAS INICIALES
// ==========================================
export const INITIAL_TECH_VISITS: TechVisit[] = INITIAL_PQR_REQUESTS.filter(
  (p) => p.resultadoMotorReglas.visitaAgendada
).map((p, idx) => {
  const cl = MOCK_CLIENTS.find((c) => c.id === p.clientId)!;
  return {
    id: `VIS-2026-${String(idx + 1).padStart(4, '0')}`,
    pqrId: p.id,
    clientId: p.clientId,
    nombreCliente: p.nombreCliente,
    contrato: p.contrato,
    servicio: p.servicio,
    municipio: cl.municipio,
    direccion: p.resultadoMotorReglas.visitaAgendada!.direccion,
    fecha: p.resultadoMotorReglas.visitaAgendada!.fecha,
    franja: p.resultadoMotorReglas.visitaAgendada!.franja,
    cuadrilla: p.resultadoMotorReglas.visitaAgendada!.cuadrilla,
    estado: p.resultadoMotorReglas.visitaAgendada!.estadoVisita,
  };
});

// Añadir 2 visitas ya realizadas de muestra
INITIAL_TECH_VISITS.push({
  id: 'VIS-2026-0099',
  pqrId: 'PQR-2026-00025',
  clientId: MOCK_CLIENTS[24].id,
  nombreCliente: MOCK_CLIENTS[24].nombreCompleto,
  contrato: MOCK_CLIENTS[24].numeroContrato,
  servicio: MOCK_CLIENTS[24].servicio,
  municipio: MOCK_CLIENTS[24].municipio,
  direccion: MOCK_CLIENTS[24].direccion,
  fecha: '10/11/2026',
  franja: 'Mañana 08:00–12:00',
  cuadrilla: 'Cuadrilla Zona 2',
  estado: 'Realizada',
  informeTecnico: {
    lecturaVerificada: 4120,
    selloIntacto: true,
    observaciones: 'Medidor verificado en sitio con patrón calibrado. Lectura acorde al consumo real.',
    fechaRegistro: '10/11/2026 11:20',
    tecnico: 'Jhon Jairo Gaviria (Téc. 402)',
  },
});

// ==========================================
// 5. AUDITORÍA, NOTIFICACIONES Y CORREOS INICIALES
// ==========================================
export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    fecha: '14/11/2026 07:30',
    actor: 'Sistema BRMS',
    rol: 'Sistema BRMS',
    accion: 'Evaluación masiva STP',
    entidad: 'PQR-2026-00001',
    detalle: 'Regla R1 aplicada: Nota crédito emitida por $ 48.300 y orden de corte cancelada.',
  },
  {
    id: 'AUD-002',
    fecha: '14/11/2026 08:12',
    actor: 'Sistema BRMS',
    rol: 'Sistema BRMS',
    accion: 'Alerta temprana SLA',
    entidad: 'PQR-2026-00039',
    detalle: 'Caso alcanzó día 13/15 de SLA legal. Dictamen preventivo activado.',
  },
];

export const INITIAL_CLIENT_NOTIFICATIONS: ClientNotification[] = [
  {
    id: 'NOTIF-001',
    clientId: 'CLI-001',
    pqrId: 'PQR-2026-00001',
    titulo: 'Resolución favorable automática (STP)',
    mensaje: 'Tu solicitud PQR-2026-00001 fue aprobada automáticamente. Se emitió Nota Crédito por $ 48.300 y se canceló la orden de corte.',
    fecha: '09/11/2026 09:18',
    leida: false,
    tipo: 'resolucion',
  },
  {
    id: 'NOTIF-002',
    clientId: 'CLI-001',
    titulo: 'Factura de Octubre 2026 disponible',
    mensaje: 'Tu factura de Energía del periodo Octubre 2026 ya se encuentra registrada en el portal de clientes.',
    fecha: '02/10/2026 08:00',
    leida: true,
    tipo: 'alerta',
  },
];

export const INITIAL_SENT_EMAILS: SentEmailEntry[] = [
  {
    id: 'MAIL-001',
    fecha: '09/11/2026 09:19',
    radicado: 'PQR-2026-00001',
    destinatario: MOCK_CLIENTS[0].correo,
    asunto: 'Copia de tu solicitud PQR-2026-00001 – EPM',
    estadoEnvio: 'Simulado',
    modo: 'Simulación',
    htmlPreview: '<p>Copia automática de constancia PQR-2026-00001 con ajuste aplicado por $ 48.300 COP.</p>',
  },
];
