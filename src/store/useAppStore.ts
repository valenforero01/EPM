import { create } from 'zustand';
import {
  AuditLogEntry,
  Client,
  ClientNotification,
  Invoice,
  PQRDisputeType,
  PQRRequest,
  PQRStatus,
  RuleEngineConfig,
  SentEmailEntry,
  TechVisit,
} from '../types';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_CLIENT_NOTIFICATIONS,
  INITIAL_PQR_REQUESTS,
  INITIAL_SENT_EMAILS,
  INITIAL_TECH_VISITS,
  MOCK_CLIENTS,
  MOCK_INVOICES,
} from '../data/mockData';
import {
  buildNewPQRRequest,
  DEFAULT_RULE_CONFIG,
  evaluateBRMS,
} from '../utils/rulesEngine';
import { formatCOP, formatDateTimeCO } from '../utils/formatters';
import { N8nTestResult, sendCopyEmailViaN8n, testN8nEndpointConnectivity } from '../utils/n8nWebhook';

export const DEMO_MODE = true;
const STORAGE_KEY = 'epm_corporativo_pqr360_v2';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export interface FilingPrefill {
  mesReclamado?: string;
  tipoInconformidad?: PQRDisputeType;
  valorFacturado?: number;
  valorReclamado?: number;
  fechaPagoRealizado?: string;
  referenciaComprobante?: string;
  lecturaReportada?: number;
  descripcionHechos?: string;
}

export type SessionState =
  | { role: 'guest' }
  | { role: 'admin'; username: 'ADMINISTRADOR'; loginTime: number }
  | { role: 'client'; clientId: string; loginTime: number };

interface PersistedState {
  pqrRequests: PQRRequest[];
  techVisits: TechVisit[];
  auditLog: AuditLogEntry[];
  sentEmails: SentEmailEntry[];
  clientNotifications: ClientNotification[];
  ruleConfig: RuleEngineConfig;
  n8nWebhookUrl: string;
  session: SessionState;
}

function loadInitialPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        pqrRequests: parsed.pqrRequests || INITIAL_PQR_REQUESTS,
        techVisits: parsed.techVisits || INITIAL_TECH_VISITS,
        auditLog: parsed.auditLog || INITIAL_AUDIT_LOG,
        sentEmails: parsed.sentEmails || INITIAL_SENT_EMAILS,
        clientNotifications: parsed.clientNotifications || INITIAL_CLIENT_NOTIFICATIONS,
        ruleConfig: parsed.ruleConfig || DEFAULT_RULE_CONFIG,
        n8nWebhookUrl: typeof parsed.n8nWebhookUrl === 'string' ? parsed.n8nWebhookUrl : '',
        session: parsed.session || { role: 'guest' },
      };
    }
  } catch {
    // ignore corrupted storage
  }
  return {
    pqrRequests: INITIAL_PQR_REQUESTS,
    techVisits: INITIAL_TECH_VISITS,
    auditLog: INITIAL_AUDIT_LOG,
    sentEmails: INITIAL_SENT_EMAILS,
    clientNotifications: INITIAL_CLIENT_NOTIFICATIONS,
    ruleConfig: DEFAULT_RULE_CONFIG,
    n8nWebhookUrl: '',
    session: { role: 'guest' },
  };
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota error
  }
}

interface AppStore extends PersistedState {
  clients: Client[];
  invoices: Invoice[];
  toasts: ToastMessage[];
  fontScale: 'normal' | 'large';
  highContrast: boolean;
  adminDarkMode: boolean;
  isChatbotOpen: boolean;
  chatbotInitialText: string | null;
  filingPrefill: FilingPrefill | null;
  lastActivityAt: number;
  inactivityWarningOpen: boolean;
  printablePqrId: string | null;

  // UI & Accessibility
  setFontScale: (s: 'normal' | 'large') => void;
  toggleHighContrast: () => void;
  toggleAdminDarkMode: () => void;
  setIsChatbotOpen: (open: boolean) => void;
  setChatbotInitialText: (text: string | null) => void;
  setFilingPrefill: (prefill: FilingPrefill | null) => void;
  setPrintablePqrId: (id: string | null) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  touchActivity: () => void;
  setInactivityWarningOpen: (open: boolean) => void;

  // Authentication
  loginAdmin: (username: string, password: string) => { ok: boolean; error?: string };
  loginClient: (contract: string, document: string) => { ok: boolean; error?: string };
  logout: (reason?: string) => void;

  // PQR & BRMS Actions
  createPQR: (params: {
    client: Client;
    invoice?: Invoice;
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
    visitDateOverride?: string;
    visitSlotOverride?: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00';
  }) => PQRRequest;

  createExOfficioPQR: (invoice: Invoice, motivo: string) => PQRRequest | null;
  updatePQRStatus: (pqrId: string, newStatus: PQRStatus, actor?: string) => void;
  assignPQRResponsible: (pqrId: string, responsable: PQRRequest['responsable'], analistaNombre?: string) => void;
  scheduleOrRescheduleVisit: (pqrId: string, fecha: string, franja: 'Mañana 08:00–12:00' | 'Tarde 13:00–17:00', cuadrilla?: string, actor?: string) => void;
  submitVisitReport: (visitId: string, lecturaVerificada: number, selloIntacto: boolean, observaciones: string, tecnico: string) => void;
  approveOrRejectAdjustment: (pqrId: string, approve: boolean, motivo: string) => void;
  prioritizePQR: (pqrId: string) => void;
  queryAMIRemote: (pqrId: string) => void;
  addInternalNote: (pqrId: string, texto: string) => void;
  sendClientResponse: (pqrId: string, texto: string) => void;
  closePQR: (pqrId: string, motivoCierre: string) => void;
  sendEmailCopy: (pqrId: string) => Promise<boolean>;
  markNotificationRead: (notifId: string) => void;

  // Config & Reset
  updateRuleConfig: (cfg: Partial<RuleEngineConfig>) => void;
  updateN8nWebhookUrl: (url: string) => void;
  testN8nWebhook: (overrideUrl?: string) => Promise<N8nTestResult>;
  resetDemoData: () => void;
}

const initial = loadInitialPersisted();

export const useAppStore = create<AppStore>((set, get) => {
  const persist = () => {
    const s = get();
    savePersisted({
      pqrRequests: s.pqrRequests,
      techVisits: s.techVisits,
      auditLog: s.auditLog,
      sentEmails: s.sentEmails,
      clientNotifications: s.clientNotifications,
      ruleConfig: s.ruleConfig,
      n8nWebhookUrl: s.n8nWebhookUrl,
      session: s.session,
    });
  };

  const pushAudit = (actor: string, rol: AuditLogEntry['rol'], accion: string, entidad: string, detalle: string) => {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      fecha: formatDateTimeCO(new Date()),
      actor,
      rol,
      accion,
      entidad,
      detalle,
    };
    set((s) => ({ auditLog: [entry, ...s.auditLog] }));
  };

  const pushClientNotif = (clientId: string, pqrId: string | undefined, titulo: string, mensaje: string, tipo: ClientNotification['tipo']) => {
    const n: ClientNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      clientId,
      pqrId,
      titulo,
      mensaje,
      fecha: formatDateTimeCO(new Date()),
      leida: false,
      tipo,
    };
    set((s) => ({ clientNotifications: [n, ...s.clientNotifications] }));
  };

  return {
    clients: MOCK_CLIENTS,
    invoices: MOCK_INVOICES,
    ...initial,
    toasts: [],
    fontScale: 'normal',
    highContrast: false,
    adminDarkMode: false,
    isChatbotOpen: false,
    chatbotInitialText: null,
    filingPrefill: null,
    lastActivityAt: Date.now(),
    inactivityWarningOpen: false,
    printablePqrId: null,

    setFontScale: (fontScale) => set({ fontScale }),
    toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
    toggleAdminDarkMode: () => set((s) => ({ adminDarkMode: !s.adminDarkMode })),
    setIsChatbotOpen: (isChatbotOpen) => set({ isChatbotOpen }),
    setChatbotInitialText: (chatbotInitialText) => set({ chatbotInitialText }),
    setFilingPrefill: (filingPrefill) => set({ filingPrefill }),
    setPrintablePqrId: (printablePqrId) => set({ printablePqrId }),

    addToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4500);
    },

    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    touchActivity: () => set({ lastActivityAt: Date.now() }),
    setInactivityWarningOpen: (inactivityWarningOpen) => set({ inactivityWarningOpen }),

    loginAdmin: (username, password) => {
      const cleanUser = username.trim().toUpperCase();
      if (cleanUser !== 'ADMINISTRADOR') {
        return { ok: false, error: 'Usuario no reconocido' };
      }
      if (password.trim() !== '823027') {
        return { ok: false, error: 'Contraseña incorrecta' };
      }
      set({
        session: { role: 'admin', username: 'ADMINISTRADOR', loginTime: Date.now() },
        lastActivityAt: Date.now(),
        inactivityWarningOpen: false,
      });
      pushAudit('ADMINISTRADOR', 'Administrador', 'Inicio de sesión', 'Consola Admin', 'Ingreso exitoso a consola de trabajadores EPM.');
      persist();
      return { ok: true };
    },

    loginClient: (contract, document) => {
      const cleanContract = contract.trim();
      const cleanDoc = document.trim();
      const found = get().clients.find((c) => c.numeroContrato === cleanContract);
      if (!found) {
        return { ok: false, error: 'No encontramos un contrato con ese número' };
      }
      if (found.numeroDocumento !== cleanDoc) {
        return { ok: false, error: 'La contraseña no coincide con la cédula del titular' };
      }
      set({
        session: { role: 'client', clientId: found.id, loginTime: Date.now() },
        lastActivityAt: Date.now(),
        inactivityWarningOpen: false,
      });
      pushAudit(found.nombreCompleto, 'Cliente', 'Inicio de sesión', `Contrato ${found.numeroContrato}`, 'Ingreso al portal de clientes.');
      persist();
      return { ok: true };
    },

    logout: (reason) => {
      const s = get().session;
      if (s.role === 'admin') {
        pushAudit('ADMINISTRADOR', 'Administrador', 'Cierre de sesión', 'Consola Admin', reason || 'Cierre de sesión manual.');
      } else if (s.role === 'client') {
        const cl = get().clients.find((c) => c.id === s.clientId);
        pushAudit(cl?.nombreCompleto || 'Cliente', 'Cliente', 'Cierre de sesión', 'Portal Clientes', reason || 'Cierre de sesión manual.');
      }
      set({
        session: { role: 'guest' },
        inactivityWarningOpen: false,
      });
      persist();
    },

    createPQR: (params) => {
      const s = get();
      const clientInvoices = s.invoices.filter((i) => i.clientId === params.client.id);
      const newPQR = buildNewPQRRequest({
        existingIds: s.pqrRequests.map((r) => r.id),
        client: params.client,
        invoice: params.invoice,
        clientInvoices,
        tipoInconformidad: params.tipoInconformidad,
        valorFacturado: params.valorFacturado,
        valorReclamado: params.valorReclamado,
        fechaPagoRealizado: params.fechaPagoRealizado,
        referenciaComprobante: params.referenciaComprobante,
        lecturaReportada: params.lecturaReportada,
        fotoMedidorUrl: params.fotoMedidorUrl,
        comprobantePagoUrl: params.comprobantePagoUrl,
        descripcionHechos: params.descripcionHechos,
        autorizaCopiaCorreo: params.autorizaCopiaCorreo,
        canalRadicacion: params.canalRadicacion,
        config: s.ruleConfig,
        visitDateOverride: params.visitDateOverride,
        visitSlotOverride: params.visitSlotOverride,
      });

      const updatedVisits = [...s.techVisits];
      if (newPQR.resultadoMotorReglas.visitaAgendada) {
        updatedVisits.unshift({
          id: `VIS-2026-${String(s.techVisits.length + 101).padStart(4, '0')}`,
          pqrId: newPQR.id,
          clientId: params.client.id,
          nombreCliente: params.client.nombreCompleto,
          contrato: params.client.numeroContrato,
          servicio: params.client.servicio,
          municipio: params.client.municipio,
          direccion: newPQR.resultadoMotorReglas.visitaAgendada.direccion,
          fecha: newPQR.resultadoMotorReglas.visitaAgendada.fecha,
          franja: newPQR.resultadoMotorReglas.visitaAgendada.franja,
          cuadrilla: newPQR.resultadoMotorReglas.visitaAgendada.cuadrilla,
          estado: 'Programada',
        });
      }

      set({
        pqrRequests: [newPQR, ...s.pqrRequests],
        techVisits: updatedVisits,
      });

      pushAudit(
        params.client.nombreCompleto,
        params.canalRadicacion === 'Oficio EPM' ? 'Administrador' : 'Cliente',
        'Radicación de PQR',
        newPQR.id,
        `Estado inicial: ${newPQR.estado} · Regla: ${newPQR.resultadoMotorReglas.reglaAplicada} · Reclamado: ${formatCOP(newPQR.valorReclamado)}.`
      );

      pushClientNotif(
        params.client.id,
        newPQR.id,
        `Solicitud ${newPQR.id} radicada (${newPQR.estado})`,
        newPQR.resultadoMotorReglas.justificacionTecnica,
        newPQR.estado === 'Procedente' ? 'resolucion' : newPQR.estado === 'Visita técnica' ? 'visita' : 'alerta'
      );

      persist();
      return newPQR;
    },

    createExOfficioPQR: (invoice, motivo) => {
      const s = get();
      const client = s.clients.find((c) => c.id === invoice.clientId);
      if (!client) return null;
      const hasExtra = invoice.cobrosAdicionales.reduce((a, b) => a + b.valor, 0);
      const tipo: PQRDisputeType = hasExtra > 0 ? 'Reconexión cobrada tras pago' : 'Lectura errónea';
      const newPQR = get().createPQR({
        client,
        invoice,
        tipoInconformidad: tipo,
        valorFacturado: invoice.valorTotal,
        valorReclamado: hasExtra > 0 ? hasExtra : Math.round(invoice.valorTotal * 0.4),
        fechaPagoRealizado: invoice.fechaPago,
        referenciaComprobante: invoice.referenciaPago,
        descripcionHechos: `Solicitud de oficio generada por auditoría preventiva de facturación: ${motivo}`,
        autorizaCopiaCorreo: true,
        canalRadicacion: 'Oficio EPM',
      });
      get().addToast({
        type: 'success',
        title: `Solicitud de oficio ${newPQR.id} creada`,
        description: `Generada para ${client.nombreCompleto} (${newPQR.estado}).`,
      });
      return newPQR;
    },

    updatePQRStatus: (pqrId, newStatus, actor = 'ADMINISTRADOR') => {
      const nowStr = formatDateTimeCO(new Date());
      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) => {
          if (r.id !== pqrId) return r;
          return {
            ...r,
            estado: newStatus,
            fechaResolucion:
              newStatus === 'Procedente' || newStatus === 'No procedente'
                ? formatDateTimeCO(new Date()).split(' ')[0]
                : r.fechaResolucion,
            fechaCierre: newStatus === 'Cerrada' ? formatDateTimeCO(new Date()).split(' ')[0] : r.fechaCierre,
            historialEventos: [
              ...r.historialEventos,
              {
                id: `EV-ST-${Date.now()}`,
                titulo: `Cambio de estado a "${newStatus}"`,
                descripcion: `Estado actualizado manualmente desde consola administrativa por ${actor}.`,
                fecha: nowStr,
                actor,
                tipo: newStatus === 'Cerrada' ? 'cierre' : 'analisis',
                estado: 'completado',
              },
            ],
          };
        }),
      }));
      pushAudit(actor, 'Administrador', 'Cambio de estado', pqrId, `Nuevo estado: ${newStatus}`);
      persist();
    },

    assignPQRResponsible: (pqrId, responsable, analistaNombre) => {
      const nowStr = formatDateTimeCO(new Date());
      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) => {
          if (r.id !== pqrId) return r;
          return {
            ...r,
            responsable,
            analistaAsignado: analistaNombre || r.analistaAsignado,
            historialEventos: [
              ...r.historialEventos,
              {
                id: `EV-ASG-${Date.now()}`,
                titulo: `Responsable asignado: ${responsable}`,
                descripcion: analistaNombre ? `Asignado a ${analistaNombre}.` : `Asignado a ${responsable}.`,
                fecha: nowStr,
                actor: 'ADMINISTRADOR',
                tipo: 'analisis',
                estado: 'completado',
              },
            ],
          };
        }),
      }));
      pushAudit('ADMINISTRADOR', 'Administrador', 'Asignación de responsable', pqrId, `${responsable} ${analistaNombre || ''}`.trim());
      persist();
    },

    scheduleOrRescheduleVisit: (pqrId, fecha, franja, cuadrilla = 'Cuadrilla Zona Centro', actor = 'ADMINISTRADOR') => {
      const nowStr = formatDateTimeCO(new Date());
      const req = get().pqrRequests.find((r) => r.id === pqrId);
      if (!req) return;
      const client = get().clients.find((c) => c.id === req.clientId);
      const direccion = req.resultadoMotorReglas.visitaAgendada?.direccion || `${client?.direccion || ''}, ${client?.barrio || ''}, ${client?.municipio || ''}`;

      set((s) => {
        const existingVisit = s.techVisits.find((v) => v.pqrId === pqrId);
        const updatedVisits = existingVisit
          ? s.techVisits.map((v) =>
              v.pqrId === pqrId ? { ...v, fecha, franja, cuadrilla, estado: 'Reprogramada' as const } : v
            )
          : [
              {
                id: `VIS-2026-${String(s.techVisits.length + 101).padStart(4, '0')}`,
                pqrId,
                clientId: req.clientId,
                nombreCliente: req.nombreCliente,
                contrato: req.contrato,
                servicio: req.servicio,
                municipio: client?.municipio || 'Medellín',
                direccion,
                fecha,
                franja,
                cuadrilla,
                estado: 'Programada' as const,
              },
              ...s.techVisits,
            ];

        return {
          techVisits: updatedVisits,
          pqrRequests: s.pqrRequests.map((r) => {
            if (r.id !== pqrId) return r;
            return {
              ...r,
              estado: 'Visita técnica',
              responsable: 'Cuadrilla Técnica',
              resultadoMotorReglas: {
                ...r.resultadoMotorReglas,
                visitaAgendada: {
                  fecha,
                  franja,
                  direccion,
                  cuadrilla,
                  estadoVisita: existingVisit ? 'Reprogramada' : 'Programada',
                },
              },
              historialEventos: [
                ...r.historialEventos,
                {
                  id: `EV-VIS-${Date.now()}`,
                  titulo: existingVisit ? 'Visita técnica reprogramada' : 'Visita técnica programada',
                  descripcion: `Cita fijada para ${fecha} (${franja}) con ${cuadrilla}.`,
                  fecha: nowStr,
                  actor,
                  tipo: 'visita',
                  estado: 'en_progreso',
                },
              ],
            };
          }),
        };
      });

      pushAudit(actor, actor === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente', 'Agenda de visita técnica', pqrId, `${fecha} (${franja})`);
      pushClientNotif(
        req.clientId,
        pqrId,
        `Visita técnica programada para ${fecha}`,
        `Cuadrilla EPM visitará tu predio el ${fecha} en la franja ${franja}.`,
        'visita'
      );
      persist();
    },

    submitVisitReport: (visitId, lecturaVerificada, selloIntacto, observaciones, tecnico) => {
      const s = get();
      const visit = s.techVisits.find((v) => v.id === visitId);
      if (!visit) return;
      const pqr = s.pqrRequests.find((r) => r.id === visit.pqrId);
      const client = s.clients.find((c) => c.id === visit.clientId);
      const nowStr = formatDateTimeCO(new Date());

      // Re-evaluación automática según informe técnico
      let newStatus: PQRStatus = 'No procedente';
      let adjusted = 0;
      let nc: string | undefined = undefined;
      let decisionMsg = 'NO PROCEDENTE – LECTURA VERIFICADA IN SITU CONFORME';
      let justif = `Cuadrilla ${visit.cuadrilla} verificó lectura ${lecturaVerificada} con sello ${selloIntacto ? 'intacto' : 'alterado'}. ${observaciones}`;

      if (!selloIntacto || (pqr && pqr.lecturaReportada && Math.abs(lecturaVerificada - pqr.lecturaReportada) <= 30)) {
        newStatus = 'Procedente';
        adjusted = pqr?.valorReclamado || 0;
        nc = `NC-2026-${Math.floor(90000 + Math.random() * 9000)}`;
        decisionMsg = 'PROCEDENTE TRAS INFORME TÉCNICO DE CUADRILLA';
        justif = `Inspección física confirmó anomalía en lectura/medidor (lectura real ${lecturaVerificada}). Nota crédito ${nc} emitida por ${formatCOP(adjusted)}.`;
      }

      set((cur) => ({
        techVisits: cur.techVisits.map((v) =>
          v.id === visitId
            ? {
                ...v,
                estado: 'Realizada',
                informeTecnico: {
                  lecturaVerificada,
                  selloIntacto,
                  observaciones,
                  fechaRegistro: nowStr,
                  tecnico,
                },
              }
            : v
        ),
        pqrRequests: cur.pqrRequests.map((r) => {
          if (r.id !== visit.pqrId) return r;
          return {
            ...r,
            estado: newStatus,
            valorAjustado: adjusted,
            valorAPagar: Math.max(0, r.valorFacturado - adjusted),
            fechaResolucion: nowStr.split(' ')[0],
            resultadoMotorReglas: {
              ...r.resultadoMotorReglas,
              decision: decisionMsg,
              justificacionTecnica: justif,
              ajusteAplicado: adjusted,
              notaCreditoGenerada: nc,
              visitaAgendada: r.resultadoMotorReglas.visitaAgendada
                ? { ...r.resultadoMotorReglas.visitaAgendada, estadoVisita: 'Realizada' }
                : undefined,
            },
            historialEventos: [
              ...r.historialEventos,
              {
                id: `EV-REP-${Date.now()}`,
                titulo: 'Informe técnico registrado y caso re-evaluado',
                descripcion: `${justif}`,
                fecha: nowStr,
                actor: tecnico,
                tipo: 'resolucion',
                estado: 'completado',
              },
            ],
          };
        }),
      }));

      if (client) {
        pushClientNotif(
          client.id,
          visit.pqrId,
          `Resultado tras visita técnica (${newStatus})`,
          justif,
          'resolucion'
        );
      }
      pushAudit('ADMINISTRADOR', 'Administrador', 'Registro de informe técnico', visit.pqrId, `Lectura ${lecturaVerificada} -> ${newStatus}`);
      get().addToast({
        type: 'success',
        title: 'Informe técnico registrado',
        description: `El caso ${visit.pqrId} se re-evaluó automáticamente como ${newStatus}.`,
      });
      persist();
    },

    approveOrRejectAdjustment: (pqrId, approve, motivo) => {
      const nowStr = formatDateTimeCO(new Date());
      const req = get().pqrRequests.find((r) => r.id === pqrId);
      if (!req) return;
      const newStatus: PQRStatus = approve ? 'Procedente' : 'No procedente';
      const adjusted = approve ? req.valorReclamado : 0;
      const nc = approve ? `NC-2026-${Math.floor(88000 + Math.random() * 9000)}` : undefined;

      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) => {
          if (r.id !== pqrId) return r;
          return {
            ...r,
            estado: newStatus,
            valorAjustado: adjusted,
            valorAPagar: Math.max(0, r.valorFacturado - adjusted),
            fechaResolucion: nowStr.split(' ')[0],
            resultadoMotorReglas: {
              ...r.resultadoMotorReglas,
              decision: approve ? 'PROCEDENTE – AJUSTE APROBADO POR ANALISTA' : 'NO PROCEDENTE – RECHAZADO CON MOTIVO',
              justificacionTecnica: motivo,
              ajusteAplicado: adjusted,
              notaCreditoGenerada: nc,
            },
            historialEventos: [
              ...r.historialEventos,
              {
                id: `EV-DEC-${Date.now()}`,
                titulo: approve ? 'Ajuste aprobado' : 'Ajuste rechazado',
                descripcion: `${motivo}${nc ? ` · Nota crédito ${nc}` : ''}`,
                fecha: nowStr,
                actor: 'ADMINISTRADOR',
                tipo: 'resolucion',
                estado: 'completado',
              },
            ],
          };
        }),
      }));
      pushAudit('ADMINISTRADOR', 'Administrador', approve ? 'Aprobación de ajuste' : 'Rechazo de ajuste', pqrId, motivo);
      pushClientNotif(
        req.clientId,
        pqrId,
        `Resolución emitida para ${pqrId}: ${newStatus}`,
        motivo,
        'resolucion'
      );
      persist();
    },

    prioritizePQR: (pqrId) => {
      const nowStr = formatDateTimeCO(new Date());
      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                priorizada: true,
                historialEventos: [
                  ...r.historialEventos,
                  {
                    id: `EV-PRIO-${Date.now()}`,
                    titulo: 'Caso priorizado por control de SLA',
                    descripcion: 'Elevado a prioridad urgente para prevenir silencio administrativo positivo.',
                    fecha: nowStr,
                    actor: 'ADMINISTRADOR',
                    tipo: 'analisis',
                    estado: 'completado',
                  },
                ],
              }
            : r
        ),
      }));
      pushAudit('ADMINISTRADOR', 'Administrador', 'Priorización SLA', pqrId, 'Caso priorizado en alerta temprana.');
      get().addToast({ type: 'info', title: `Solicitud ${pqrId} priorizada`, description: 'Movida al primer lugar de atención.' });
      persist();
    },

    queryAMIRemote: (pqrId) => {
      const nowStr = formatDateTimeCO(new Date());
      const req = get().pqrRequests.find((r) => r.id === pqrId);
      if (!req) return;
      const nc = `NC-2026-${Math.floor(83000 + Math.random() * 9000)}`;
      const adjusted = req.valorReclamado;

      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                estado: 'Procedente',
                valorAjustado: adjusted,
                valorAPagar: Math.max(0, r.valorFacturado - adjusted),
                responsable: 'Automático STP',
                fechaResolucion: nowStr.split(' ')[0],
                resultadoMotorReglas: {
                  ...r.resultadoMotorReglas,
                  decision: 'PROCEDENTE TRAS TELEMETRÍA REMOTA AMI (STP)',
                  justificacionTecnica: `Lectura remota verificada en concentrador AMI. Se confirma error en ciclo previo y se emite nota crédito ${nc} por ${formatCOP(adjusted)}.`,
                  ajusteAplicado: adjusted,
                  notaCreditoGenerada: nc,
                },
                historialEventos: [
                  ...r.historialEventos,
                  {
                    id: `EV-AMI-${Date.now()}`,
                    titulo: 'Lectura remota AMI verificada',
                    descripcion: `Cotejo telemétrico exitoso. Nota crédito ${nc} aplicada por ${formatCOP(adjusted)}.`,
                    fecha: nowStr,
                    actor: 'Sistema AMI EPM',
                    tipo: 'resolucion',
                    estado: 'completado',
                  },
                ],
              }
            : r
        ),
      }));

      pushAudit('Sistema AMI EPM', 'Sistema BRMS', 'Consulta remota AMI', pqrId, `Resuelto STP con Nota Crédito ${nc}.`);
      pushClientNotif(req.clientId, pqrId, `Lectura AMI validada en ${pqrId}`, `Se ajustó ${formatCOP(adjusted)} en tu factura mediante Nota Crédito ${nc}.`, 'resolucion');
      get().addToast({ type: 'success', title: 'Telemetría AMI verificada', description: `Nota crédito ${nc} aplicada automáticamente.` });
      persist();
    },

    addInternalNote: (pqrId, texto) => {
      if (!texto.trim()) return;
      const nowStr = formatDateTimeCO(new Date());
      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                notasInternas: [
                  ...r.notasInternas,
                  { id: `NOTE-${Date.now()}`, autor: 'ADMINISTRADOR', texto: texto.trim(), fecha: nowStr },
                ],
              }
            : r
        ),
      }));
      pushAudit('ADMINISTRADOR', 'Administrador', 'Nota interna agregada', pqrId, texto.trim());
      persist();
    },

    sendClientResponse: (pqrId, texto) => {
      if (!texto.trim()) return;
      const nowStr = formatDateTimeCO(new Date());
      const req = get().pqrRequests.find((r) => r.id === pqrId);
      if (!req) return;

      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                mensajesCliente: [
                  ...r.mensajesCliente,
                  { id: `MSG-${Date.now()}`, autor: 'Equipo EPM', rol: 'EPM', texto: texto.trim(), fecha: nowStr },
                ],
                historialEventos: [
                  ...r.historialEventos,
                  {
                    id: `EV-MSG-${Date.now()}`,
                    titulo: 'Respuesta enviada al cliente',
                    descripcion: texto.trim(),
                    fecha: nowStr,
                    actor: 'ADMINISTRADOR',
                    tipo: 'notificacion',
                    estado: 'completado',
                  },
                ],
              }
            : r
        ),
      }));

      pushClientNotif(req.clientId, pqrId, `Nuevo mensaje en tu solicitud ${pqrId}`, texto.trim(), 'respuesta');
      pushAudit('ADMINISTRADOR', 'Administrador', 'Respuesta enviada al cliente', pqrId, texto.trim());
      get().addToast({ type: 'success', title: 'Respuesta enviada al cliente', description: 'El cliente recibió una notificación en su portal.' });
      persist();
    },

    closePQR: (pqrId, motivoCierre) => {
      const nowStr = formatDateTimeCO(new Date());
      const req = get().pqrRequests.find((r) => r.id === pqrId);
      if (!req) return;
      set((s) => ({
        pqrRequests: s.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                estado: 'Cerrada',
                fechaCierre: nowStr.split(' ')[0],
                historialEventos: [
                  ...r.historialEventos,
                  {
                    id: `EV-CLS-${Date.now()}`,
                    titulo: 'Caso cerrado definitivamente',
                    descripcion: motivoCierre,
                    fecha: nowStr,
                    actor: 'ADMINISTRADOR',
                    tipo: 'cierre',
                    estado: 'completado',
                  },
                ],
              }
            : r
        ),
      }));
      pushAudit('ADMINISTRADOR', 'Administrador', 'Cierre de caso', pqrId, motivoCierre);
      pushClientNotif(req.clientId, pqrId, `Solicitud ${pqrId} cerrada`, motivoCierre, 'resolucion');
      persist();
    },

    sendEmailCopy: async (pqrId) => {
      const s = get();
      const req = s.pqrRequests.find((r) => r.id === pqrId);
      if (!req) return false;

      const result = await sendCopyEmailViaN8n(req, s.n8nWebhookUrl);
      const nowStr = formatDateTimeCO(new Date());

      set((cur) => ({
        sentEmails: [result, ...cur.sentEmails],
        pqrRequests: cur.pqrRequests.map((r) =>
          r.id === pqrId
            ? {
                ...r,
                historialEventos: [
                  ...r.historialEventos,
                  {
                    id: `EV-MAIL-${Date.now()}`,
                    titulo: 'Copia enviada al correo',
                    descripcion: `Envío hacia ${req.correoCliente} · Estado: ${result.estadoEnvio} (${result.modo}).`,
                    fecha: nowStr,
                    actor: cur.session.role === 'admin' ? 'ADMINISTRADOR' : req.nombreCliente,
                    tipo: 'correo',
                    estado: result.estadoEnvio === 'Error' ? 'alerta' : 'completado',
                  },
                ],
              }
            : r
        ),
      }));

      pushAudit(
        s.session.role === 'admin' ? 'ADMINISTRADOR' : req.nombreCliente,
        s.session.role === 'admin' ? 'Administrador' : 'Cliente',
        'Copia enviada al correo',
        pqrId,
        `${req.correoCliente} · ${result.estadoEnvio} (${result.modo})`
      );

      if (result.estadoEnvio === 'Error') {
        get().addToast({
          type: 'error',
          title: 'No se pudo enviar el correo',
          description: 'Verifica la URL del webhook n8n en Administración > Reglas.',
        });
        persist();
        return false;
      }

      get().addToast({
        type: 'success',
        title: result.estadoEnvio === 'Simulado' ? 'Copia enviada (Simulado)' : 'Copia enviada al correo',
        description: `Se remitió la constancia de ${pqrId} a ${req.correoCliente}.`,
      });
      persist();
      return true;
    },

    markNotificationRead: (notifId) => {
      set((s) => ({
        clientNotifications: s.clientNotifications.map((n) => (n.id === notifId ? { ...n, leida: true } : n)),
      }));
      persist();
    },

    updateRuleConfig: (cfg) => {
      set((s) => ({ ruleConfig: { ...s.ruleConfig, ...cfg } }));
      pushAudit('ADMINISTRADOR', 'Administrador', 'Actualización de reglas BRMS', 'Configuración', JSON.stringify(cfg));
      get().addToast({ type: 'success', title: 'Reglas del motor actualizadas', description: 'Los cambios aplicarán en las próximas evaluaciones.' });
      persist();
    },

    updateN8nWebhookUrl: (n8nWebhookUrl) => {
      set({ n8nWebhookUrl });
      pushAudit('ADMINISTRADOR', 'Administrador', 'Configuración webhook n8n', 'Integración n8n', n8nWebhookUrl || '(Sin URL - modo simulado)');
      get().addToast({ type: 'success', title: 'URL de n8n guardada', description: n8nWebhookUrl ? 'Integración lista para envío real.' : 'Modo simulación activado.' });
      persist();
    },

    testN8nWebhook: async (overrideUrl) => {
      const targetUrl = (overrideUrl ?? get().n8nWebhookUrl).trim();
      const sample = get().pqrRequests[0];
      const result = await testN8nEndpointConnectivity(targetUrl, sample);

      pushAudit(
        'ADMINISTRADOR',
        'Administrador',
        'Prueba de conectividad n8n',
        'Integración n8n',
        result.ok
          ? `POST exitoso (${result.mode}${result.statusCode ? ` HTTP ${result.statusCode}` : ''}) · ${result.latencyMs} ms`
          : `Error de conectividad: ${result.errorMessage || 'Fallo en POST'}`
      );

      if (result.ok) {
        if (overrideUrl !== undefined && overrideUrl.trim() !== get().n8nWebhookUrl) {
          set({ n8nWebhookUrl: targetUrl });
        }
        get().addToast({
          type: result.mode === 'no-cors' ? 'warning' : 'success',
          title:
            result.mode === 'no-cors'
              ? 'POST enviado vía no-cors'
              : `Conexión n8n verificada (HTTP ${result.statusCode})`,
          description:
            result.mode === 'no-cors'
              ? 'La petición llegó al endpoint, pero CORS impide leer la respuesta.'
              : `Respuesta recibida en ${result.latencyMs} ms.`,
        });
      } else {
        get().addToast({
          type: 'error',
          title: 'Falló la prueba de conectividad n8n',
          description: result.errorMessage || 'Verifica la URL del webhook.',
        });
      }

      persist();
      return result;
    },

    resetDemoData: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        pqrRequests: INITIAL_PQR_REQUESTS,
        techVisits: INITIAL_TECH_VISITS,
        auditLog: INITIAL_AUDIT_LOG,
        sentEmails: INITIAL_SENT_EMAILS,
        clientNotifications: INITIAL_CLIENT_NOTIFICATIONS,
        ruleConfig: DEFAULT_RULE_CONFIG,
        n8nWebhookUrl: '',
      });
      pushAudit('ADMINISTRADOR', 'Administrador', 'Restablecimiento de datos', 'Sistema', 'Se restauraron los datos iniciales de demostración.');
      get().addToast({ type: 'info', title: 'Datos de demostración restablecidos', description: '60 clientes, 360 facturas y 45 PQRs iniciales cargados.' });
      persist();
    },
  };
});
