/**
 * Helpers compartidos por la UI del módulo: etiquetas, formatos y el mapa de
 * roles semánticos a props de MUI.
 */
import { QUALITY_META, QUALITY_THRESHOLDS, RATING_META } from './constants';
import { bracketFor } from './timing';
import type { DesignCard } from './types';

export { RATING_META, QUALITY_META };

/** Color de MUI para un rol semántico. `secondary` no existe como color de Chip. */
export type MuiColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/** Objetivo del tramo, para tooltips: "1–4 · ≤ 30 min". */
export function bracketLabel(productCount: number): string {
  const b = bracketFor(productCount);
  return `${b.label} · ≤ ${b.base} min`;
}

/** dd/mm — las fechas de promoción se leen de un vistazo en la tarjeta. */
export function shortDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function dateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Rango de vigencia del flyer. */
export const promoRange = (card: DesignCard): string =>
  `${shortDate(card.promoStart)} → ${shortDate(card.promoEnd)}`;

/** Errores que cuentan para la métrica de calidad del diseñador. */
export const designerErrorCount = (card: DesignCard): number => card.auditIssues.length;

/** Promedio de errores por diseño → 🟢 / 🟡 / 🔴 */
export function qualityFor(totalErrors: number, totalDesigns: number) {
  if (!totalDesigns) return QUALITY_META.good;
  const avg = totalErrors / totalDesigns;
  if (avg <= QUALITY_THRESHOLDS.good) return QUALITY_META.good;
  if (avg <= QUALITY_THRESHOLDS.fair) return QUALITY_META.fair;
  return QUALITY_META.poor;
}

/** Texto sutil bajo el título: distingue circular y duplicado sin gritar. */
export function cardSubtitle(card: DesignCard): string | null {
  if (card.type === 'mms_circular') return 'Modalidad circular';
  if (card.isDuplicate) return 'Duplicado';
  return null;
}
