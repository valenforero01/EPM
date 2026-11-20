/**
 * Generadores locales de vistas previas SVG (Data URI) para comprobantes de pago y fotos de medidor.
 * Cero dependencias de URLs externas.
 */

export function createMockReceiptSvgDataUri(refCode = 'EPM-PSE-61025', date = '16/10/2026', amount = '$ 133.350'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">
    <rect width="480" height="280" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="0" y="0" width="480" height="52" rx="12" fill="#003B5C"/>
    <rect x="0" y="38" width="480" height="14" fill="#003B5C"/>
    <text x="24" y="33" font-family="sans-serif" font-size="15" font-weight="bold" fill="#ffffff">COMPROBANTE DE RECAUDO · PSE / BANCOLOMBIA</text>
    <circle cx="442" cy="26" r="10" fill="#00A859"/>
    <path d="M437 26 l3 3 l7 -7" stroke="#fff" stroke-width="2" fill="none"/>
    <text x="24" y="84" font-family="sans-serif" font-size="11" fill="#64748b">REFERENCIA DE PAGO</text>
    <text x="24" y="105" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">${refCode}</text>
    <text x="265" y="84" font-family="sans-serif" font-size="11" fill="#64748b">FECHA Y HORA</text>
    <text x="265" y="105" font-family="monospace" font-size="15" font-weight="bold" fill="#0f172a">${date} 14:22</text>
    <line x1="24" y1="128" x2="456" y2="128" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="24" y="158" font-family="sans-serif" font-size="11" fill="#64748b">CONVENIO RECAUDADOR</text>
    <text x="24" y="178" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Empresas Públicas de Medellín (Prototipo)</text>
    <text x="24" y="214" font-family="sans-serif" font-size="11" fill="#64748b">VALOR CANCELADO</text>
    <text x="24" y="242" font-family="monospace" font-size="24" font-weight="bold" fill="#00A859">${amount} COP</text>
    <rect x="330" y="212" width="126" height="32" rx="6" fill="#dcfce7" stroke="#86efac"/>
    <text x="393" y="233" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#007A43">TRANSACCIÓN OK</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createMockMeterSvgDataUri(reading = 5240, unit = 'kWh'): string {
  const digits = String(Math.max(0, Math.round(reading))).padStart(6, '0').slice(-6).split('');
  const digitBoxes = digits
    .map(
      (d, idx) => `
      <rect x="${96 + idx * 46}" y="104" width="38" height="54" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="${115 + idx * 46}" y="141" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="#34d399">${d}</text>
    `
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">
    <rect width="480" height="280" rx="14" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <rect x="44" y="34" width="392" height="212" rx="12" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
    <text x="68" y="68" font-family="sans-serif" font-size="13" font-weight="bold" fill="#003B5C">CARÁTULA MEDIDOR · LECTURA OCR</text>
    <rect x="78" y="88" width="324" height="86" rx="8" fill="#1e293b"/>
    ${digitBoxes}
    <text x="392" y="196" text-anchor="end" font-family="monospace" font-size="16" font-weight="bold" fill="#0f172a">${unit}</text>
    <circle cx="96" cy="206" r="14" fill="#00A859" opacity="0.2"/>
    <circle cx="96" cy="206" r="6" fill="#00A859"/>
    <text x="120" y="211" font-family="sans-serif" font-size="12" fill="#475569">Sello metrológico intacto · Lectura extraída por OCR</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
