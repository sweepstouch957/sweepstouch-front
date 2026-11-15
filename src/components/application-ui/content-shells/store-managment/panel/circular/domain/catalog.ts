/** Reglas de negocio del catálogo de la tienda. Puro: sin React, sin MUI, sin HTTP. */
import type { StoreProduct } from '@/services/circular';
import { regularFromPrice } from './prices';

export type UpcomingSummaryRow = {
  date: string;
  title: string;
  total: number;
  nuevos: number;
  precios: number;
};

/** Recorte crudo del flyer (trae precio y texto) o sin foto, con limpieza en curso:
 *  no se muestra, para que nadie lo tome por la imagen final. */
export const isGeneratingImage = (p: Pick<StoreProduct, 'imageUrl'>, cleaning: boolean) =>
  cleaning && (!p.imageUrl || /\/circular-products\//.test(p.imageUrl));

/** Lo que todavía no arrancó, agrupado por fecha de entrada: el encargado sube el flyer
 *  de la semana que viene y necesita ver qué sale (o cambia de precio) y cuándo. */
export function buildUpcomingSummary(items: StoreProduct[]): UpcomingSummaryRow[] {
  const byDate = new Map<string, UpcomingSummaryRow>();
  for (const p of items) {
    if (!p.effectiveFrom) continue;
    const row = byDate.get(p.effectiveFrom) ?? {
      date: p.effectiveFrom,
      title: p.effectiveCircularTitle || '',
      total: 0,
      nuevos: 0,
      precios: 0,
    };
    row.total += 1;
    if (p.effectiveKind === 'price') row.precios += 1;
    else row.nuevos += 1;
    byDate.set(p.effectiveFrom, row);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Productos con oferta pero sin precio regular calculable. */
export const missingRegularOf = (items: StoreProduct[]) =>
  items.filter((p) => !p.originalPrice?.trim() && regularFromPrice(p.price));

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
