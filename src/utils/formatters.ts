/**
 * Utilidades de formateo para Colombia:
 * - Pesos colombianos: $ 48.300
 * - Fechas: dd/mm/aaaa
 * - Días hábiles excluyendo sábados, domingos y festivos oficiales de Colombia 2026
 */

export function formatCOP(val: number): string {
  if (isNaN(val)) return '$ 0';
  const rounded = Math.round(val);
  const absFormatted = Math.abs(rounded).toLocaleString('es-CO');
  return rounded < 0 ? `- $ ${absFormatted}` : `$ ${absFormatted}`;
}

export function formatDateCO(date: Date | string): string {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTimeCO(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function parseDateCO(dStr: string): Date | null {
  if (!dStr) return null;
  const parts = dStr.split(' ')[0].split('/').map(Number);
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

export function isDateBeforeOrEqualCO(d1Str: string, d2Str: string): boolean {
  const d1 = parseDateCO(d1Str);
  const d2 = parseDateCO(d2Str);
  if (!d1 || !d2) return false;
  return d1.getTime() <= d2.getTime();
}

// Festivos oficiales de Colombia 2026 (formato YYYY-MM-DD)
export const COLOMBIA_HOLIDAYS_2026 = new Set<string>([
  '2026-01-01', // Año Nuevo
  '2026-01-12', // Reyes Magos
  '2026-03-23', // San José
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajo
  '2026-05-18', // Ascensión del Señor
  '2026-06-08', // Corpus Christi
  '2026-06-15', // Sagrado Corazón
  '2026-06-29', // San Pedro y San Pablo
  '2026-07-20', // Independencia
  '2026-08-07', // Batalla de Boyacá
  '2026-08-17', // Asunción de la Virgen
  '2026-10-12', // Día de la Raza
  '2026-11-02', // Todos los Santos
  '2026-11-16', // Independencia de Cartagena
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25', // Navidad
]);

export function isColombianBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return !COLOMBIA_HOLIDAYS_2026.has(`${y}-${m}-${d}`);
}

export function addColombianBusinessDays(start: Date | string, businessDays = 15): string {
  const base = typeof start === 'string' ? (parseDateCO(start) || new Date()) : new Date(start);
  const cur = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let count = 0;
  while (count < businessDays) {
    cur.setDate(cur.getDate() + 1);
    if (isColombianBusinessDay(cur)) {
      count++;
    }
  }
  return formatDateCO(cur);
}

export function getNextBusinessDateCO(daysAhead = 2): string {
  return addColombianBusinessDays(new Date(), daysAhead);
}

export function generateRadicadoNumber(existingIds: string[]): string {
  let maxNum = 0;
  existingIds.forEach((id) => {
    const match = id.match(/PQR-2026-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `PQR-2026-${String(maxNum + 1).padStart(5, '0')}`;
}
