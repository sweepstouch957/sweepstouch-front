/**
 * Lógica de precios del cartón.
 *
 * El formato se deriva SOLO de los valores, nunca de un selector:
 *   dollars = 0            → centavos:  95¢ · 89¢ LB · 2/95¢     (nunca "$0.xx")
 *   qty > 1                → múltiple:  2/$12.95 · 5/$10 · 4/$ LB. FOR
 *   resto                  → simple:    $12.99 EA. · $5 EA.
 *   cents = 0              → sin superíndice ni ".00"
 */
import type { PriceUnit, ShelfSignProduct } from './types';

export type PriceFormat = 'cents' | 'multi' | 'simple';

/* ── Clamps: los inputs del editor no pueden producir un cartón inválido ── */

export const clampQty = (v: unknown): number => Math.max(1, Math.floor(Number(v)) || 1);

export const clampDollars = (v: unknown): number => Math.max(0, Math.floor(Number(v)) || 0);

export const clampCents = (v: unknown): number =>
  Math.min(99, Math.max(0, Math.floor(Number(v)) || 0));

export const clampUnit = (v: unknown): PriceUnit =>
  v === 'LB' || v === 'EA' ? v : '';

/** Valores de precio ya saneados de un producto. */
export interface PriceValues {
  qty: number;
  dollars: number;
  cents: number;
  unit: PriceUnit;
  format: PriceFormat;
}

export function priceValues(p: Pick<ShelfSignProduct, 'qty' | 'dollars' | 'cents' | 'unit'>): PriceValues {
  const qty = clampQty(p.qty);
  const dollars = clampDollars(p.dollars);
  const cents = clampCents(p.cents);
  const unit = clampUnit(p.unit);
  const format: PriceFormat = dollars === 0 ? 'cents' : qty > 1 ? 'multi' : 'simple';
  return { qty, dollars, cents, unit, format };
}

/**
 * Cómo se va a imprimir, en texto plano. Es la vista previa en vivo del editor
 * ("Se imprimirá: 2/$12.95") — la revisión humana depende de que esto sea
 * exactamente lo que termina en la góndola.
 */
export function priceLabel(p: Pick<ShelfSignProduct, 'qty' | 'dollars' | 'cents' | 'unit'>): string {
  const { qty, dollars, cents, unit, format } = priceValues(p);
  const suffix = unit ? ` ${unit}.` : '';
  const decimals = cents > 0 ? `.${String(cents).padStart(2, '0')}` : '';

  if (format === 'cents') return `${qty > 1 ? `${qty}/` : ''}${cents}¢${suffix}`;
  if (format === 'multi') return `${qty}/$${dollars}${decimals}${unit ? ` ${unit}. FOR` : ''}`;
  return `$${dollars}${decimals}${suffix}`;
}
