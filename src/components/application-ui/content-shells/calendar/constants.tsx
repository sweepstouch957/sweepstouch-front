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

/**
 * Gris para lo que no es de ninguna tienda (feriados, fechas culturales, Navidad…): el color
 * del tipo queda para las actividades que sí tienen tienda, que es lo que hay que ver.
 */
export const NO_STORE_COLOR = { bg: '#9AA0A6', fg: '#fff' };
export const eventColor = (e: Pick<CalendarEvent, 'type' | 'stores'>) => {
  const ty = EVENT_TYPES[e.type] || EVENT_TYPES.otro;
  return (e.stores || []).length ? ty : { ...ty, ...NO_STORE_COLOR };
};

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

/* ── Categorías (pedido de Pedro): celebraciones del año vs actividades de tienda ── */
export type Category = 'all' | 'celebraciones' | 'tienda';
export const CATEGORY_LABEL: Record<Category, string> = {
  all: 'Todo',
  celebraciones: 'Celebraciones del año',
  tienda: 'Actividades de tienda',
};
const CELEBRATION_TYPES: EventType[] = ['feriado', 'festividad', 'cultural', 'comercial'];
/** Celebración general (feriado, festividad, cultural, comercial) sin tienda concreta. */
export const isCelebration = (e: CalendarEvent) =>
  CELEBRATION_TYPES.includes(e.type) && e.stores.length === 0;
export const inCategory = (e: CalendarEvent, c: Category) =>
  c === 'all' ? true : c === 'celebraciones' ? isCelebration(e) : !isCelebration(e);

/* ── Estaciones: tinte pastel suave por fecha (hemisferio norte / EE. UU.) ── */
export type Season = 'invierno' | 'primavera' | 'verano' | 'otono';
/** Pasteles fijos: son un dato visual del calendario, iguales en claro y oscuro (alpha distinta). */
export const SEASONS: Record<Season, { label: string; color: string; emoji: string }> = {
  invierno: { label: 'Invierno', color: '#7FB3E6', emoji: '❄️' },
  primavera: { label: 'Primavera', color: '#8FD19E', emoji: '🌸' },
  verano: { label: 'Verano', color: '#F5C542', emoji: '☀️' },
  otono: { label: 'Otoño', color: '#E8955F', emoji: '🍂' },
};
export const seasonOf = (key: string): Season => {
  const m = Number(key.slice(5, 7));
  if (m === 12 || m <= 2) return 'invierno';
  if (m <= 5) return 'primavera';
  if (m <= 8) return 'verano';
  return 'otono';
};

/** Abarca hoy: empezó y todavía no terminó (ej. Hispanic Heritage Month, 15 sep → 15 oct). */
export const isOngoing = (e: Pick<CalendarEvent, 'date' | 'endDate'>, today: string) =>
  e.date <= today && endKey(e) >= today;

/** Línea principal / secundaria: la tienda primero, la actividad después (pedido de Pedro). */
export const headline = (e: CalendarEvent) => {
  const store = e.stores[0]?.storeName || '';
  if (!store) return { primary: e.title, secondary: '' };
  const same = e.title.toLowerCase().startsWith(store.toLowerCase());
  return {
    primary: store,
    secondary: same ? e.title.slice(store.length).replace(/^[\s—·-]+/, '') : e.title,
  };
};
