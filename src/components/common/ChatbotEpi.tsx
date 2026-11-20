import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X, Bot, ArrowRight, FileSearch, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { PQRDisputeType } from '../../types';
import { formatCOP } from '../../utils/formatters';

interface ChatMsg {
  id: string;
  sender: 'epi' | 'user';
  text: string;
  ctaLabel?: string;
  ctaType?: PQRDisputeType;
  ctaLogin?: boolean;
}

export const ChatbotEpi: React.FC = () => {
  const navigate = useNavigate();
  const {
    isChatbotOpen,
    setIsChatbotOpen,
    chatbotInitialText,
    setChatbotInitialText,
    session,
    clients,
    pqrRequests,
    setFilingPrefill,
  } = useAppStore();

  const currentClient = session.role === 'client' ? clients.find((c) => c.id === session.clientId) : undefined;

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome-1',
      sender: 'epi',
      text: '¡Hola! Soy Epi, tu asistente virtual de EPM. Puedo orientarte con cobros de reconexión tras haber pagado, lecturas erróneas del medidor, tarifas de contador o consultar el estado de tu radicado PQR-2026-xxxxx.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing, isChatbotOpen]);

  useEffect(() => {
    if (chatbotInitialText && isChatbotOpen) {
      const txt = chatbotInitialText;
      setChatbotInitialText(null);
      handleSend(txt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotInitialText, isChatbotOpen]);

  const replyWithDelay = (reply: Omit<ChatMsg, 'id' | 'sender'>) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `epi-${Date.now()}`, sender: 'epi', ...reply },
      ]);
    }, 520);
  };

  const processMessage = (text: string) => {
    const lower = text.toLowerCase();

    // Búsqueda de radicado PQR-2026-xxxxx
    const pqrMatch = text.toUpperCase().match(/PQR-2026-\d{4,5}/);
    if (pqrMatch) {
      const radicado = pqrMatch[0];
      if (!currentClient) {
        replyWithDelay({
          text: `Para proteger tu privacidad y consultar el radicado ${radicado}, primero debes iniciar sesión en el Portal de Clientes con tu número de contrato y cédula.`,
          ctaLabel: 'Ir al Portal de Clientes',
          ctaLogin: true,
        });
        return;
      }
      const found = pqrRequests.find((r) => r.id === radicado && r.clientId === currentClient.id);
      if (!found) {
        replyWithDelay({
          text: `No encontramos el radicado ${radicado} asociado a tu contrato ${currentClient.numeroContrato}. Verifica el número o revisa la pestaña "Mis solicitudes".`,
        });
        return;
      }
      replyWithDelay({
        text: `Radicado ${found.id} (${found.tipoInconformidad}): Estado actual "${found.estado}". Días hábiles SLA: ${found.diasTranscurridosSLA}/15 (límite ${found.fechaLimite}). Valor reclamado: ${formatCOP(found.valorReclamado)} · Ajustado: ${formatCOP(found.valorAjustado)}. ${found.resultadoMotorReglas.justificacionTecnica}`,
      });
      return;
    }

    if (lower.includes('reconex') || lower.includes('corte') || lower.includes('suspens') || lower.includes('pagu')) {
      replyWithDelay({
        text: 'Entiendo tu molestia. Si te cobraron reconexión o suspensión después de haber pagado antes de la fecha de corte, nuestro sistema valida el recaudo por API y puede anular el cobro automáticamente (STP).',
        ctaLabel: 'Radicar por reconexión tras pago',
        ctaType: 'Reconexión cobrada tras pago',
      });
      return;
    }

    if (lower.includes('lectura') || lower.includes('medidor') || lower.includes('consumo') || lower.includes('alto')) {
      replyWithDelay({
        text: 'Con gusto revisamos tu lectura. Si tienes la foto de la carátula de tu medidor, la validamos por OCR contra tu histórico de 6 meses o consultamos telemetría remota AMI.',
        ctaLabel: 'Radicar por lectura errónea',
        ctaType: 'Lectura errónea',
      });
      return;
    }

    if (lower.includes('tarifa') || lower.includes('contador') || lower.includes('estrato') || lower.includes('cargo')) {
      replyWithDelay({
        text: 'Podemos validar si la tarifa de contador o cargo fijo facturado corresponde a tu estrato y medidor registrados en el contrato.',
        ctaLabel: 'Radicar por tarifa de contador',
        ctaType: 'Tarifa de medidor/contador',
      });
      return;
    }

    if (lower.includes('asesor') || lower.includes('humano') || lower.includes('persona')) {
      replyWithDelay({
        text: 'Puedes radicar tu caso y seleccionar "Análisis" o solicitar contacto por tu canal preferido (WhatsApp, correo o teléfono), o llamar a nuestra línea ficticia 01 8000 000 000.',
        ctaLabel: currentClient ? 'Ir a Radicar PQR' : 'Ingresar al Portal Clientes',
        ctaType: currentClient ? 'Otro' : undefined,
        ctaLogin: !currentClient,
      });
      return;
    }

    if (lower.includes('estado') || lower.includes('radicado') || lower.includes('solicitud')) {
      if (!currentClient) {
        replyWithDelay({
          text: 'Para consultar el estado de tus solicitudes debes iniciar sesión en el Portal Clientes. También puedes escribirme un número como PQR-2026-00001 una vez hayas ingresado.',
          ctaLabel: 'Ingresar al Portal Clientes',
          ctaLogin: true,
        });
      } else {
        const own = pqrRequests.filter((r) => r.clientId === currentClient.id);
        replyWithDelay({
          text: own.length
            ? `Tienes ${own.length} solicitud(es) registrada(s). La más reciente es ${own[0].id} en estado "${own[0].estado}". Escríbeme su código para darte el detalle completo o abre "Mis solicitudes".`
            : 'Aún no tienes solicitudes radicadas en tu contrato. Si tienes algún cobro irregular puedo ayudarte a radicar una ahora.',
          ctaLabel: own.length ? undefined : 'Radicar nueva PQR',
          ctaType: own.length ? undefined : 'Otro',
        });
      }
      return;
    }

    // Respuesta de respaldo
    replyWithDelay({
      text: 'Puedo ayudarte a resolver cobros improcedentes o consultar tus PQRs. Elige una opción rápida abajo o escribe tu número de radicado (ej. PQR-2026-00001).',
      ctaLabel: currentClient ? 'Iniciar radicación guiada' : 'Ir al Portal Clientes',
      ctaType: currentClient ? 'Reconexión cobrada tras pago' : undefined,
      ctaLogin: !currentClient,
    });
  };

  const handleSend = (overrideText?: string) => {
    const content = (overrideText ?? input).trim();
    if (!content) return;
    setMessages((prev) => [...prev, { id: `usr-${Date.now()}`, sender: 'user', text: content }]);
    if (!overrideText) setInput('');
    processMessage(content);
  };

  const handleActionClick = (msg: ChatMsg) => {
    if (msg.ctaType) {
      setFilingPrefill({
        tipoInconformidad: msg.ctaType,
        descripcionHechos: `Solicitud prellenada desde asistente Epi (${msg.ctaType}).`,
      });
    }
    setIsChatbotOpen(false);
    if (msg.ctaLogin || !currentClient) {
      navigate('/clientes/login');
    } else {
      navigate('/clientes/radicar');
    }
  };

  return (
    <div className="no-print fixed bottom-5 right-5 z-[60]">
      {!isChatbotOpen ? (
        <button
          type="button"
          onClick={() => setIsChatbotOpen(true)}
          aria-label="Abrir asistente virtual Epi"
          className="group flex items-center gap-3 rounded-full bg-[#003B5C] hover:bg-[#00263D] text-white pl-4 pr-5 py-3 shadow-2xl border border-white/15 transition-all"
        >
          <span className="w-9 h-9 rounded-full bg-[#00A859] flex items-center justify-center shadow-inner">
            <Bot className="w-5 h-5 text-white" aria-hidden="true" />
          </span>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">Asistente Epi</div>
            <div className="text-[11px] text-emerald-300">Autogestión PQR 360</div>
          </div>
        </button>
      ) : (
        <div
          role="dialog"
          aria-label="Chat con asistente virtual Epi"
          className="w-[calc(100vw-2rem)] sm:w-[390px] h-[540px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        >
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-[#003B5C] to-[#007A43] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Epi · Asistente Virtual EPM</h3>
                <p className="text-[11px] text-emerald-100">
                  {currentClient ? `Contrato ${currentClient.numeroContrato}` : 'Orientación PQR 24/7'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChatbotOpen(false)}
              aria-label="Cerrar asistente Epi"
              className="p-1.5 rounded-lg hover:bg-white/15"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Opciones rápidas */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5">
            {[
              'Me cobraron reconexión y ya pagué',
              'Lectura errónea del medidor',
              'Consultar estado de mi PQR',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[#003B5C] hover:border-[#00A859] hover:text-[#007A43] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Historial de mensajes */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F8FA]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-[#00A859] text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
                {m.ctaLabel && (
                  <button
                    type="button"
                    onClick={() => handleActionClick(m)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#003B5C] hover:bg-[#00263D] text-white text-xs font-semibold shadow-sm"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    {m.ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {typing && (
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-500">
                <MessageSquare className="w-3.5 h-3.5 text-[#00A859]" />
                Epi está escribiendo...
              </div>
            )}
          </div>

          {/* Barra de envío */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta o radicado..."
              aria-label="Escribe tu consulta para el asistente Epi"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-[#00A859] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              className="p-2.5 rounded-xl bg-[#00A859] hover:bg-[#007A43] text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
