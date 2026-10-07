/**
 * Medición de tiempos.
 *
 * Se mide UN solo tiempo: elaboración = "Iniciar diseño" → "Pasar a auditoría",
 * descontando todo el tiempo en On Hold.
 *
 * NO se miden (sólo quedan registrados como eventos) el tiempo de toma
 * —asignación hasta inicio— ni el tiempo en Errores/Updates.
 */
import { LATE_MARGIN, TIME_TABLE, type TimeBracket } from './constants';
import type { DesignCard, HoldPeriod } from './types';

export type TimeRating = 'on_time' | 'late' | 'over';
export type CardTimeState = TimeRating | 'running' | 'pending';

const MINUTE = 60 * 1000;

const ms = (iso: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Minutos en On Hold dentro de la ventana [from, to].
 * Se recorta cada tramo a la ventana: una pausa anterior al inicio de diseño no
 * debe descontarse del tiempo de elaboración.
 */
export function holdMillis(periods: HoldPeriod[], from: number, to: number): number {
  return periods.reduce((total, period) => {
    const start = ms(period.start);
    if (start === null) return total;
    const end = ms(period.end) ?? to;
    const overlap = Math.min(end, to) - Math.max(start, from);
    return overlap > 0 ? total + overlap : total;
  }, 0);
}

/**
 * Minutos netos de elaboración. `null` si el diseño todavía no arrancó.
 * Si sigue en curso, cuenta hasta `now`.
 */
export function elaborationMinutes(card: DesignCard, now: number = Date.now()): number | null {
  const start = ms(card.timestamps.designStartedAt);
  if (start === null) return null;

  const end = ms(card.timestamps.sentToAuditAt) ?? now;
  const gross = Math.max(0, end - start);
  const paused = holdMillis(card.holdPeriods, start, end);
  return Math.max(0, gross - paused) / MINUTE;
}

/** Tramo de la tabla según cantidad de productos. */
export function bracketFor(productCount: number): TimeBracket {
  const n = Math.max(1, Math.floor(productCount) || 1);
  // Por encima de 30 productos no hay tramo definido: se usa el último, que es
  // el criterio más laxo, para no penalizar un caso que la tabla no contempla.
  return TIME_TABLE.find((b) => n <= b.maxProducts) ?? TIME_TABLE[TIME_TABLE.length - 1];
}

/** 🟢 ≤ base · 🟡 base+1 a base+10 · 🔴 > base+10 */
export function ratingFor(minutes: number, productCount: number): TimeRating {
  const { base } = bracketFor(productCount);
  if (minutes <= base) return 'on_time';
  if (minutes <= base + LATE_MARGIN) return 'late';
  return 'over';
}

/** Estado de tiempo de una tarjeta, listo para pintar el chip. */
export function cardTimeState(card: DesignCard, now: number = Date.now()): CardTimeState {
  const minutes = elaborationMinutes(card, now);
  if (minutes === null) return 'pending';
  if (!card.timestamps.sentToAuditAt) return 'running';
  return ratingFor(minutes, card.productCount);
}

/** Sólo las que terminaron cuentan para las métricas de puntualidad. */
export function finishedRating(card: DesignCard): TimeRating | null {
  const minutes = elaborationMinutes(card);
  if (minutes === null || !card.timestamps.sentToAuditAt) return null;
  return ratingFor(minutes, card.productCount);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** ¿Está pausada ahora mismo? Un tramo sin cierre es una pausa activa. */
export const isPaused = (card: DesignCard): boolean =>
  card.holdPeriods.some((p) => p.end === null);
