import type { CalendarEvent, EventStatus, EventType } from '@/services/calendar.service';
import type { Theme } from '@mui/material/styles';

/**
 * Colores por tipo de evento. Excepción documentada a "cero hex": el tipo se
 * persiste en BD y su color tiene que ser estable e igual en el panel, en el
 * correo y en WhatsApp — no puede depender del theme ni del modo oscuro.
 */
export const EVENT_TYPES: Record<
  EventType,
  { label: string; plural: string; bg: string; fg: string }
> = {
  aniversario: { label: 'Aniversario', plural: 'Aniversarios', bg: '#C7165C', fg: '#fff' },
  activacion: { label: 'Activación / Sorteo', plural: 'Activaciones', bg: '#0F7F76', fg: '#fff' },
  visita: { label: 'Visita a tienda', plural: 'Visitas', bg: '#1F6FB2', fg: '#fff' },
  reunion: { label: 'Reunión', plural: 'Reuniones', bg: '#4B5563', fg: '#fff' },
  feriado: { label: 'Feriado', plural: 'Feriados', bg: '#C8423B', fg: '#fff' },
  festividad: { label: 'Festividad', plural: 'Festividades', bg: '#F2B544', fg: '#231F20' },
  cultural: { label: 'Cultural hispana', plural: 'Cultural hispana', bg: '#6E3A9A', fg: '#fff' },
  comercial: { label: 'Comercial', plural: 'Comercial', bg: '#2F7A4B', fg: '#fff' },
  otro: { label: 'Otro', plural: 'Otros', bg: '#8A8F98', fg: '#fff' },
};

export const TYPE_KEYS = Object.keys(EVENT_TYPES) as EventType[];

export const STATUS_LABEL: Record<EventStatus, string> = {
  confirmado: 'Confirmado',
  por_confirmar: 'Por confirmar',
  cancelado: 'Cancelado',
  finalizado: 'Finalizado',
};

export const SOURCE_LABEL = {
  event: 'Evento',
  task: 'Tarea de Cowork',
  visit: 'Visita de soporte',
} as const;

export const PARTICIPANT_SOURCE_LABEL: Record<string, string> = {
  owner: 'lo lleva',
  area: 'su área',
  direccion: 'Dirección',
  manual: 'sumado a mano',
};

/** Color de estado desde el theme (esto sí es UI, no dato). */
export const statusColor = (theme: Theme, st: EventStatus): string =>
  ({
    confirmado: theme.palette.success.main,
    por_confirmar: theme.palette.warning.main,
    cancelado: theme.palette.error.main,
    finalizado: theme.palette.text.secondary,
  })[st] || theme.palette.text.primary;

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
export const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ── Helpers de fecha (todo en "YYYY-MM-DD", sin TZ) ── */
export const pad = (n: number) => String(n).padStart(2, '0');
export const isoKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const keyToDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayKey = () => isoKey(new Date());

/** Último día que ocupa el evento. */
export const endKey = (e: Pick<CalendarEvent, 'date' | 'endDate'>) =>
  e.endDate && e.endDate > e.date ? e.endDate : e.date;

export const spansDay = (e: Pick<CalendarEvent, 'date' | 'endDate'>, key: string) =>
  key >= e.date && key <= endKey(e);

export const fmtTime = (t?: string) => {
  if (!/^\d\d:\d\d$/.test(t || '')) return '';
  const [H, M] = (t as string).split(':').map(Number);
  return `${H % 12 || 12}:${pad(M)} ${H < 12 ? 'a. m.' : 'p. m.'}`;
};

export const timeRange = (e: Pick<CalendarEvent, 'startTime' | 'endTime'>) =>
  e.startTime ? fmtTime(e.startTime) + (e.endTime ? ` – ${fmtTime(e.endTime)}` : '') : '';

export const longDate = (e: Pick<CalendarEvent, 'date' | 'endDate'>) => {
  const o: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const a = keyToDate(e.date).toLocaleDateString('es-US', o);
  if (!e.endDate || e.endDate <= e.date) return a;
  const b = keyToDate(e.endDate).toLocaleDateString('es-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return `${a} → ${b}`;
};

export const shortDay = (key: string) => {
  const d = keyToDate(key);
  return { day: d.getDate(), mon: MONTHS[d.getMonth()].slice(0, 3), dow: DOW[d.getDay()] };
};

export const storesLine = (e: CalendarEvent) =>
  e.stores.length === 0
    ? ''
    : e.stores.length === 1
      ? e.stores[0].storeName
      : `${e.stores.length} tiendas`;

/** Texto buscable de un evento. */
export const searchText = (e: CalendarEvent) =>
  `${e.title} ${e.type} ${e.ownerName} ${e.description} ${e.stores
    .map((s) => `${s.storeName} ${s.storeAddress} ${s.contact}`)
    .join(' ')}`.toLowerCase();

export const fmtNum = (n: number) => n.toLocaleString('en-US');
