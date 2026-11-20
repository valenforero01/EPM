import { PQRRequest, SentEmailEntry } from '../types';
import { formatCOP, formatDateTimeCO } from './formatters';

export function buildConstanciaHTML(pqr: PQRRequest): string {
  return `
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Constancia ${pqr.id} - EPM</title></head>
<body style="font-family:Inter,Arial,sans-serif;color:#0f172a;background:#f5f8fa;padding:24px;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8ee;border-radius:16px;padding:28px;">
    <div style="border-bottom:3px solid #00A859;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;">
      <div>
        <span style="background:#00A859;color:#fff;font-weight:800;padding:4px 10px;border-radius:999px;font-size:13px;">EPM</span>
        <strong style="margin-left:8px;color:#003B5C;font-size:16px;">Empresas Públicas de Medellín</strong>
        <p style="margin:6px 0 0;font-size:12px;color:#64748b;">Constancia PQR 360 · Prototipo académico – sin validez legal</p>
      </div>
      <div style="text-align:right;">
        <div style="font-family:monospace;font-weight:700;font-size:16px;">${pqr.id}</div>
        <div style="font-size:12px;color:#64748b;">Radicado: ${pqr.fechaRadicacion}</div>
      </div>
    </div>
    <h2 style="font-size:16px;color:#003B5C;margin:0 0 12px;">Datos del Titular y Contrato</h2>
    <p style="font-size:13px;line-height:1.6;margin:0 0 16px;">
      <strong>Titular:</strong> ${pqr.nombreCliente} (${pqr.tipoDocumento} ${pqr.numeroDocumento})<br/>
      <strong>Contrato:</strong> ${pqr.contrato} · <strong>Servicio:</strong> ${pqr.servicio}<br/>
      <strong>Periodo reclamado:</strong> ${pqr.mesReclamado} · <strong>Tipo:</strong> ${pqr.tipoInconformidad}
    </p>
    <div style="background:#f5f8fa;border:1px solid #e2e8ee;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:700;">Resultado (${pqr.estado})</div>
      <div style="font-size:15px;font-weight:700;color:#007A43;margin-top:4px;">${pqr.resultadoMotorReglas.decision}</div>
      <p style="font-size:13px;color:#334155;margin:8px 0;">${pqr.resultadoMotorReglas.justificacionTecnica}</p>
      <p style="font-size:13px;margin:8px 0 0;">
        <strong>Valor Facturado:</strong> ${formatCOP(pqr.valorFacturado)} ·
        <strong>Reclamado:</strong> ${formatCOP(pqr.valorReclamado)} ·
        <strong>Ajustado:</strong> ${formatCOP(pqr.valorAjustado)} ·
        <strong>Valor a Pagar:</strong> ${formatCOP(pqr.valorAPagar)}
      </p>
    </div>
    <p style="font-size:11px;color:#64748b;line-height:1.5;">
      Ley 142 de 1994 (Art. 158): Término máximo de 15 días hábiles (${pqr.fechaLimite}). Silencio administrativo positivo aplicable conforme a la ley. Prototipo académico – datos ficticios – sin validez legal.
    </p>
  </div>
</body>
</html>`.trim();
}

export async function sendCopyEmailViaN8n(
  pqr: PQRRequest,
  webhookUrl: string
): Promise<SentEmailEntry> {
  const constanciaHTML = buildConstanciaHTML(pqr);
  const asunto = `Copia de tu solicitud ${pqr.id} – EPM`;
  const payload = {
    evento: 'copia_solicitud_pqr',
    radicado: pqr.id,
    estado: pqr.estado,
    tipo: pqr.tipoInconformidad,
    periodo: pqr.mesReclamado,
    fechaRadicacion: pqr.fechaRadicacion,
    fechaLimite: pqr.fechaLimite,
    valorFacturado: pqr.valorFacturado,
    valorReclamado: pqr.valorReclamado,
    resultado: {
      decision: pqr.resultadoMotorReglas.decision,
      regla: pqr.resultadoMotorReglas.reglaAplicada,
      justificacion: pqr.resultadoMotorReglas.justificacionTecnica,
      valorAjustado: pqr.valorAjustado,
      valorAPagar: pqr.valorAPagar,
    },
    cliente: {
      nombre: pqr.nombreCliente,
      correo: pqr.correoCliente,
      contrato: pqr.contrato,
      servicio: pqr.servicio,
    },
    asunto,
    constanciaHTML,
  };

  const trimmedUrl = (webhookUrl || '').trim();
  const timestamp = formatDateTimeCO(new Date());

  if (!trimmedUrl) {
    await new Promise((res) => setTimeout(res, 550));
    return {
      id: `MAIL-${Date.now()}`,
      fecha: timestamp,
      radicado: pqr.id,
      destinatario: pqr.correoCliente,
      asunto,
      estadoEnvio: 'Simulado',
      modo: 'Simulación',
      htmlPreview: constanciaHTML,
    };
  }

  try {
    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      id: `MAIL-${Date.now()}`,
      fecha: timestamp,
      radicado: pqr.id,
      destinatario: pqr.correoCliente,
      asunto,
      estadoEnvio: 'Enviado (n8n)',
      modo: 'CORS',
      htmlPreview: constanciaHTML,
    };
  } catch {
    // Reintentar con mode: "no-cors" enviando el JSON en campo de formulario "payload"
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      await fetch(trimmedUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      return {
        id: `MAIL-${Date.now()}`,
        fecha: timestamp,
        radicado: pqr.id,
        destinatario: pqr.correoCliente,
        asunto,
        estadoEnvio: 'Enviado (n8n)',
        modo: 'no-cors',
        htmlPreview: constanciaHTML,
      };
    } catch {
      return {
        id: `MAIL-${Date.now()}`,
        fecha: timestamp,
        radicado: pqr.id,
        destinatario: pqr.correoCliente,
        asunto,
        estadoEnvio: 'Error',
        modo: 'CORS',
        htmlPreview: constanciaHTML,
      };
    }
  }
}

export interface N8nTestResult {
  ok: boolean;
  mode: 'CORS' | 'no-cors' | 'Error';
  statusCode?: number;
  latencyMs: number;
  timestamp: string;
  endpoint: string;
  responsePreview?: string;
  errorMessage?: string;
  payloadSent: Record<string, unknown>;
}

export async function testN8nEndpointConnectivity(
  webhookUrl: string,
  samplePqr: PQRRequest
): Promise<N8nTestResult> {
  const trimmedUrl = (webhookUrl || '').trim();
  const timestamp = formatDateTimeCO(new Date());
  const constanciaHTML = buildConstanciaHTML(samplePqr);
  const asunto = `[PRUEBA] Copia de solicitud ${samplePqr.id} – EPM`;

  const payload: Record<string, unknown> = {
    evento: 'prueba_conectividad_n8n',
    pruebaConectividad: true,
    origen: 'EPM – Portal Corporativo y PQR 360 (Consola Admin)',
    fechaPrueba: timestamp,
    radicado: samplePqr.id,
    estado: samplePqr.estado,
    tipo: samplePqr.tipoInconformidad,
    periodo: samplePqr.mesReclamado,
    fechaRadicacion: samplePqr.fechaRadicacion,
    fechaLimite: samplePqr.fechaLimite,
    valorFacturado: samplePqr.valorFacturado,
    valorReclamado: samplePqr.valorReclamado,
    resultado: {
      decision: samplePqr.resultadoMotorReglas.decision,
      regla: samplePqr.resultadoMotorReglas.reglaAplicada,
      justificacion: samplePqr.resultadoMotorReglas.justificacionTecnica,
      valorAjustado: samplePqr.valorAjustado,
      valorAPagar: samplePqr.valorAPagar,
    },
    cliente: {
      nombre: samplePqr.nombreCliente,
      correo: samplePqr.correoCliente,
      contrato: samplePqr.contrato,
      servicio: samplePqr.servicio,
    },
    asunto,
    constanciaHTML,
  };

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Protocolo inválido');
    }
  } catch {
    return {
      ok: false,
      mode: 'Error',
      latencyMs: 0,
      timestamp,
      endpoint: trimmedUrl,
      errorMessage: 'Ingresa una URL válida que comience por https:// o http://.',
      payloadSent: payload,
    };
  }

  const startedAt = performance.now();

  try {
    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const latencyMs = Math.round(performance.now() - startedAt);
    let responseText = '';
    try {
      responseText = (await response.text()).slice(0, 400);
    } catch {
      responseText = '';
    }

    if (!response.ok) {
      return {
        ok: false,
        mode: 'CORS',
        statusCode: response.status,
        latencyMs,
        timestamp,
        endpoint: trimmedUrl,
        responsePreview: responseText || undefined,
        errorMessage: `El endpoint respondió con código HTTP ${response.status} (${response.statusText || 'Error'}).`,
        payloadSent: payload,
      };
    }

    return {
      ok: true,
      mode: 'CORS',
      statusCode: response.status,
      latencyMs,
      timestamp,
      endpoint: trimmedUrl,
      responsePreview: responseText || 'OK (cuerpo vacío)',
      payloadSent: payload,
    };
  } catch {
    // Reintento en modo no-cors para webhooks n8n sin cabeceras Access-Control-Allow-Origin
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
      await fetch(trimmedUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      const latencyMs = Math.round(performance.now() - startedAt);
      return {
        ok: true,
        mode: 'no-cors',
        latencyMs,
        timestamp,
        endpoint: trimmedUrl,
        responsePreview:
          'Petición POST enviada con mode: "no-cors" (campo form-data "payload"). El navegador bloqueó la lectura de respuesta por política CORS del servidor destino.',
        payloadSent: payload,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startedAt);
      return {
        ok: false,
        mode: 'Error',
        latencyMs,
        timestamp,
        endpoint: trimmedUrl,
        errorMessage:
          err instanceof Error
            ? `No se pudo conectar con el endpoint (${err.message}).`
            : 'No fue posible conectar con el endpoint proporcionado.',
        payloadSent: payload,
      };
    }
  }
}

