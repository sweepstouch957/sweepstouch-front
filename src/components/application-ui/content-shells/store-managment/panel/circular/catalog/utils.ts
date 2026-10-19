import type { Circular, StoreProduct } from '@/services/circular.service';
import { regularFromPrice } from '../shared';
import type { UpcomingSummaryRow } from './constants';

/** Recorte crudo del flyer (trae precio y texto) o sin foto, con limpieza en curso:
 *  no se muestra, para que nadie lo tome por la imagen final. */
export const isGeneratingImage = (p: StoreProduct, cleaning: boolean) =>
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

/** Vigente primero, después el agendado, después el que haya. */
export const pickCurrent = <T extends Pick<Circular, 'status'>>(list: T[], ok = (_: T) => true) =>
  list.find((x) => x.status === 'active' && ok(x)) ||
  list.find((x) => x.status === 'scheduled' && ok(x)) ||
  list.find(ok);

/** Imagen directa del circular (sin pedirle al servidor que renderice el PDF). */
export const directImageOf = (c: Circular) =>
  c.previewImageUrl || (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');

/** Sólo importa en qué rango cae el ancho: 420 = teléfono, 900 = angosto, 1000 = tabla normal. */
export const widthBucket = (w: number) => (w <= 420 ? 420 : w <= 900 ? 900 : 1000);

/** "1 regular" / "3 regulares". */
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
