/**
 * Fecha límite con hora opcional.
 *
 * Sin hora, la tarea vence al final del día — así se comportaba siempre y no
 * queremos que poner sólo la fecha signifique "vence a medianoche".
 * Con hora, el bot puede avisar "vence a las 3" en vez de "vence hoy".
 */

/** Se guarda 23:59 cuando el usuario no eligió hora. */
const END_OF_DAY = { h: 23, m: 59 };

/** ¿Esta fecha tiene una hora puesta a mano, o es el fin de día por defecto? */
export function hasExplicitTime(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const isEndOfDay = d.getHours() === END_OF_DAY.h && d.getMinutes() === END_OF_DAY.m;
  const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
  return !isEndOfDay && !isMidnight;
}

/**
 * "YYYY-MM-DD" en hora LOCAL para el input date.
 * No sirve `iso.slice(0,10)`: con hora cercana a medianoche la fecha UTC cae
 * un día antes o después de la que ve el usuario.
 */
export function toDateInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "HH:mm" para el input, o "" si la fecha no lleva hora explícita. */
export function timeInputValue(iso?: string | null): string {
  if (!hasExplicitTime(iso)) return '';
  const d = new Date(iso as string);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Combina "YYYY-MM-DD" + "HH:mm" en un ISO en la hora LOCAL del navegador.
 * Sin hora usa 23:59 del mismo día.
 */
export function combineDueDate(date: string, time?: string): string | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = time
    ? time.split(':').map(Number)
    : [END_OF_DAY.h, END_OF_DAY.m];
  const local = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}

/** "5 ago" o "5 ago 15:00" — la hora sólo aparece si se puso a mano. */
export function formatDue(iso?: string | null, opts: { long?: boolean } = {}): string {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  const fecha = d.toLocaleDateString('es-HN', {
    day: 'numeric',
    month: opts.long ? 'long' : 'short',
    ...(opts.long ? { weekday: 'long' } : {}),
  });
  if (!hasExplicitTime(iso)) return fecha;
  return `${fecha} ${d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;
}
