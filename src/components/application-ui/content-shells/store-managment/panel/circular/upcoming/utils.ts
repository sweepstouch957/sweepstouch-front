/** Tipos, constantes y formateadores puros de la pestaña Próximos. */
import type { StoreBanner, StoreProduct, UpcomingGroup } from '@/services/circular.service';

const TZ = 'America/New_York';
const DAY = 24 * 60 * 60 * 1000;

// Cards que se pintan por grupo antes de "Ver los restantes".
export const GROUP_PREVIEW = 24;

/** Banner programado tal como lo devuelve getUpcoming (con su día de salida). */
export type UpcomingBanner = StoreBanner & { day: string };

export type Confirm =
  | { kind: 'group'; group: UpcomingGroup }
  | { kind: 'publish'; product: StoreProduct }
  | { kind: 'cancel'; product: StoreProduct };

export type EditorTarget = { product: StoreProduct; flyerUrl: string };

export type AgentsOptions = {
  /** Argos: segunda pasada por secciones. */
  missing: boolean;
  /** Iris: rehacer todas las fotos del flyer. */
  photos: boolean;
};

// Un formateador por formato (crear uno por llamada en listas largas se nota).
// `day` es YYYY-MM-DD de la tienda: se fija al mediodía UTC para que no cambie de día.
const longDayFmt = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const monthFmt = new Intl.DateTimeFormat('es-ES', { month: 'short', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: TZ });
const todayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

const dayDate = (day: string) => new Date(`${day}T12:00:00Z`);

/** "jueves, 23 de octubre". */
export const fmtDay = (day: string) => longDayFmt.format(dayDate(day));

/** "oct" (para la ficha de fecha del grupo). */
export const fmtMonth = (day: string) => monthFmt.format(dayDate(day));

/** "23 oct" en hora de la tienda. */
export const fmtShort = (iso: string) => shortFmt.format(new Date(iso));

/** "hoy", "mañana", "en 3 días" — contado en días calendario de la tienda. */
export function relDay(day: string) {
  const today = todayFmt.format(new Date());
  const diff = Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY
  );
  if (diff <= 0) return 'hoy';
  if (diff === 1) return 'mañana';
  return `en ${diff} días`;
}

/** "23 oct → 29 oct": el fin del banner es exclusivo, se muestra el último día que corre. */
export const bannerRange = (b: UpcomingBanner) =>
  `${fmtShort(b.startDate)} → ${fmtShort(new Date(+new Date(b.endDate) - 1).toISOString())}`;

export const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.error || e?.message || fallback;

/** Letra chica que va a salir: caja, mostrador, condición de la oferta. */
export function fineText(p: StoreProduct) {
  const pend = p.pending;
  return [
    (pend?.packQty ?? 0) > 1 ? `Caja ${pend?.packQty} ${pend?.packUnit}` : '',
    p.counterOnly ? 'Mostrador' : '',
    p.offerCondition,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Título legible del origen del grupo (campaña o circular). */
export const originLabel = (c: NonNullable<UpcomingGroup['circular']>) =>
  c.fromCampaign ? `Campaña · ${c.title.replace(/^Campaña:\s*/, '')}` : c.title || 'Circular';
