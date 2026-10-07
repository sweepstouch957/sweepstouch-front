/**
 * Lógica de precios del cartón.
 *
 * El formato se deriva SOLO de los valores, nunca de un selector:
 *   dollars = 0            → centavos:  95¢ · 89¢ LB · 2/95¢     (nunca "$0.xx")
 *   qty > 1                → múltiple:  2/$12.95 · 5/$10 · 4/$ LB. FOR
 *   resto                  → simple:    $12.99 EA. · $5 EA.
 *   cents = 0              → sin superíndice ni ".00"
 */
import type { FreeOffer, PriceUnit, ShelfSignProduct } from './types';

export type PriceFormat = 'free' | 'cents' | 'multi' | 'simple';

/* ── Clamps: los inputs del editor no pueden producir un cartón inválido ── */

export const clampQty = (v: unknown): number => Math.max(1, Math.floor(Number(v)) || 1);

export const clampDollars = (v: unknown): number => Math.max(0, Math.floor(Number(v)) || 0);

export const clampCents = (v: unknown): number =>
  Math.min(99, Math.max(0, Math.floor(Number(v)) || 0));

export const clampUnit = (v: unknown): PriceUnit =>
  v === 'LB' || v === 'EA' ? v : '';

/** `null` si no hay oferta sin precio: "gratis cero unidades" no existe. */
export const clampFreeOffer = (v: unknown): FreeOffer | null => {
  if (!v || typeof v !== 'object') return null;
  const raw = v as Partial<FreeOffer>;
  const free = Math.floor(Number(raw.free));
  if (!Number.isFinite(free) || free < 1) return null;
  const buy = Math.floor(Number(raw.buy));
  return { buy: Number.isFinite(buy) && buy > 0 ? buy : 0, free: Math.min(99, free) };
};

/** Valores de precio ya saneados de un producto. */
export interface PriceValues {
  qty: number;
  dollars: number;
  cents: number;
  unit: PriceUnit;
  format: PriceFormat;
  /** Sólo con `format: 'free'`. */
  freeOffer: FreeOffer | null;
}

/** Lo que mira el precio: los números y, si la hay, la oferta sin precio. */
type PriceInput = Pick<ShelfSignProduct, 'qty' | 'dollars' | 'cents' | 'unit'> &
  Partial<Pick<ShelfSignProduct, 'freeOffer'>>;

export function priceValues(p: PriceInput): PriceValues {
  const qty = clampQty(p.qty);
  const dollars = clampDollars(p.dollars);
  const cents = clampCents(p.cents);
  const unit = clampUnit(p.unit);
  const freeOffer = clampFreeOffer(p.freeOffer);
  // La oferta sin precio manda: si está, no hay número que imprimir.
  const format: PriceFormat = freeOffer
    ? 'free'
    : dollars === 0
      ? 'cents'
      : qty > 1
        ? 'multi'
        : 'simple';
  return { qty, dollars, cents, unit, format, freeOffer };
}

/**
 * Cómo se va a imprimir, en texto plano. Es la vista previa en vivo del editor
 * ("Se imprimirá: 2/$12.95") — la revisión humana depende de que esto sea
 * exactamente lo que termina en la góndola.
 */
export function priceLabel(p: PriceInput): string {
  const { qty, dollars, cents, unit, format, freeOffer } = priceValues(p);
  const suffix = unit ? ` ${unit}.` : '';
  const decimals = cents > 0 ? `.${String(cents).padStart(2, '0')}` : '';

  if (format === 'free') return freeOfferLabel(freeOffer!);
  if (format === 'cents') return `${qty > 1 ? `${qty}/` : ''}${cents}¢${suffix}`;
  if (format === 'multi') return `${qty}/$${dollars}${decimals}${unit ? ` ${unit}. FOR` : ''}`;
  return `$${dollars}${decimals}${suffix}`;
}

/** "BUY 1 GET 2 FREE" o, sin cantidad a llevar, "FREE". */
export function freeOfferLabel(f: FreeOffer): string {
  return f.buy > 0 ? `BUY ${f.buy} GET ${f.free} FREE` : 'FREE';
}

/* ── Condición de compra de un producto gratis ───────────────────────────── */

/**
 * "WITH ADD'L $130 PURCHASE", "WITH $25 PURCHASE", "CON COMPRA DE $50".
 *
 * Sólo la exigencia de comprar otra cosa, no cualquier condición: "LIMIT 4
 * OFFERS PER FAMILY" o "WITH CLUB CARD" siguen siendo letra chica del producto.
 */
const PURCHASE_CONDITION = [
  /\bwith\b[^\n]*\bpurchase\b/i,
  /\bpurchase\s+of\b/i,
  /\bcon\s+(?:la\s+)?compra\b/i,
  /\bcompra\s+m[ií]nima\b/i,
];

/**
 * La condición de compra de un FREE, para imprimirla debajo del FREE.
 *
 * Un producto gratis sin su "con compra de $130" al lado es una promesa que la
 * tienda no puede cumplir, y a 11.5 px entre la letra chica del nombre no se lee
 * desde el pasillo. Cuando el cartón es un FREE a secas, esa línea sube al
 * bloque de precio y se imprime grande; las demás condiciones no se mueven.
 *
 * Sólo en el FREE sin cantidad a llevar: en un BOGO el "lleve 1" ya está arriba
 * y la condición no es la que manda.
 */
export function freePurchaseCondition(
  p: Pick<ShelfSignProduct, 'conditions'> & Partial<Pick<ShelfSignProduct, 'freeOffer'>>
): string | null {
  const offer = clampFreeOffer(p.freeOffer);
  if (!offer || offer.buy > 0) return null;
  const line = (p.conditions || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && PURCHASE_CONDITION.some((re) => re.test(l)));
  return line || null;
}

/** Las condiciones que quedan con el nombre, sin la que subió al precio. */
export function remainingConditions(
  p: Pick<ShelfSignProduct, 'conditions'> & Partial<Pick<ShelfSignProduct, 'freeOffer'>>
): string[] {
  const moved = freePurchaseCondition(p);
  return (p.conditions || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l !== moved);
}

/* ── Savings ─────────────────────────────────────────────────────────────── */

/**
 * Lee un precio del texto libre que trae el flyer en "regular price".
 * Devuelve CENTAVOS POR UNIDAD, o null si no hay un número usable.
 *
 * Formas que aparecen en los flyers reales:
 *   "$2.99 LB."      → 299
 *   "$5"             → 500
 *   "79¢ EA"         → 79
 *   "4 LB./$25.99"   → 650  (precio del paquete ÷ 4)
 *   "2/$7"           → 350
 */
export function parseRegularCents(text: string): number | null {
  const t = String(text || '').trim();
  if (!t) return null;

  // "4/$25.99" o "4 LB./$25.99" — el precio es por el paquete, no por unidad.
  const pack = t.match(/(\d+)\s*(?:LB|EA)?\.?\s*\/\s*\$\s*(\d+)(?:[.,](\d{1,2}))?/i);
  if (pack) {
    const n = Math.max(1, Number(pack[1]));
    const cents = Number(pack[2]) * 100 + (pack[3] ? Number(pack[3].padEnd(2, '0')) : 0);
    return Math.round(cents / n);
  }

  const dollars = t.match(/\$\s*(\d+)(?:[.,](\d{1,2}))?/);
  if (dollars) {
    return Number(dollars[1]) * 100 + (dollars[2] ? Number(dollars[2].padEnd(2, '0')) : 0);
  }

  const cents = t.match(/(\d{1,3})\s*¢/);
  if (cents) return Number(cents[1]);

  return null;
}

/** Centavos → como se imprime en el cartón: 70¢ · $4.97 */
export function formatMoney(totalCents: number): string {
  if (totalCents < 100) return `${totalCents}¢`;
  return `$${(totalCents / 100).toFixed(2)}`;
}

/**
 * Calcula el texto de "Save" comparando el regular price del flyer con el
 * precio de oferta del cartón. Devuelve '' si no se puede calcular.
 *
 * Todo en centavos enteros: con floats, $2.99 - $2.29 daba 0.6999999999999998
 * y el cartón salía con un ahorro de "69¢" en vez de 70¢.
 *
 * En promos múltiples el ahorro es POR OFERTA (comprando las N unidades), que
 * es el número que le importa al cliente parado en la góndola:
 *   3/$10 contra $4.99 EA → 3×499 − 1000 = "$4.97 PER OFFER"
 */
export function computeSave(
  p: PriceInput & Pick<ShelfSignProduct, 'regularPrice'>
): string {
  const regularPerUnit = parseRegularCents(p.regularPrice);
  if (regularPerUnit === null) return '';

  const { qty, dollars, cents, unit, format, freeOffer } = priceValues(p);

  // En un BOGO lo que se ahorra son las unidades regaladas, a precio regular.
  if (format === 'free') {
    const saving = regularPerUnit * (freeOffer?.free || 0);
    return saving > 0 ? `${formatMoney(saving)} PER OFFER` : '';
  }
  const offerTotal = dollars * 100 + cents;
  if (offerTotal <= 0) return '';

  if (qty > 1) {
    const saving = regularPerUnit * qty - offerTotal;
    return saving > 0 ? `${formatMoney(saving)} PER OFFER` : '';
  }

  const saving = regularPerUnit - offerTotal;
  if (saving <= 0) return '';
  return `${formatMoney(saving)} PER ${unit || 'ITEM'}`;
}
