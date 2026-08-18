import type { QboAging } from '@/services/qbo.service';

/* Intl instanciado una vez a nivel de módulo — se usa por fila de tabla */
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (v: number | null | undefined) => usdFmt.format(Number(v ?? 0));

/** QBO devuelve YYYY-MM-DD sin zona. new Date() lo leería como UTC y restaría un día. */
export const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
};

export const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const then = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - then) / 86_400_000));
};

/** Cubetas de antigüedad — mismas que el reporte A/R Aging de QuickBooks. */
export const AGING_BUCKETS: Array<{
  key: keyof QboAging;
  label: string;
  short: string;
  color: 'success' | 'info' | 'warning' | 'error';
}> = [
  { key: 'current', label: 'Al día', short: 'Al día', color: 'success' },
  { key: 'd1_30', label: '1 a 30 días', short: '1-30', color: 'info' },
  { key: 'd31_60', label: '31 a 60 días', short: '31-60', color: 'warning' },
  { key: 'd61_90', label: '61 a 90 días', short: '61-90', color: 'warning' },
  { key: 'd90plus', label: 'Más de 90 días', short: '90+', color: 'error' },
];

/** Severidad por atraso. Alimenta el color del chip de días vencidos. */
export function overdueColor(days: number): 'success' | 'info' | 'warning' | 'error' {
  if (days <= 0) return 'success';
  if (days <= 30) return 'info';
  if (days <= 60) return 'warning';
  return 'error';
}

/** Diferencias por debajo de un centavo son redondeo, no descuadre. */
export const DRIFT_EPSILON = 0.01;

export type ReceivablesFilter = 'all' | 'debt' | 'overdue' | 'unlinked' | 'drift';

export const FILTER_OPTIONS: Array<{ value: ReceivablesFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'debt', label: 'Con deuda' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'unlinked', label: 'Sin vincular' },
  { value: 'drift', label: 'Descuadradas' },
];

/* ── Rango de fechas ──────────────────────────────────────────────── */

export type RangePreset = 'all' | 'thisYear' | 'lastYear' | 'last90' | 'custom';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Atajos de rango. "Todo el histórico" es el default a propósito: es el único
 * modo en que el saldo sale de Customer.Balance, que ya viene neto de créditos.
 * Con rango, el saldo se recalcula sumando las facturas emitidas dentro.
 */
export function presetToRange(preset: RangePreset): { from: string | null; to: string | null } {
  const now = new Date();
  switch (preset) {
    case 'thisYear':
      return { from: `${now.getFullYear()}-01-01`, to: null };
    case 'lastYear':
      return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
    case 'last90': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { from: ymd(d), to: null };
    }
    default:
      return { from: null, to: null };
  }
}

export const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: 'all', label: 'Todo el histórico' },
  { value: 'thisYear', label: `Año ${new Date().getFullYear()}` },
  { value: 'lastYear', label: `Año ${new Date().getFullYear() - 1}` },
  { value: 'last90', label: 'Últimos 90 días' },
  { value: 'custom', label: 'Rango…' },
];
