/**
 * Normalización de lo que llega de la IA y del textarea manual.
 *
 * La revisión humana es obligatoria por diseño, pero cuanto más limpio llegue
 * el dato al editor, menos correcciones hace el diseñador.
 */
import { clampCents, clampDollars, clampQty, clampUnit, computeSave } from './price';
import type { PhotoBox, ShelfSignProduct } from './types';

export const uid = (): string => Math.random().toString(36).slice(2, 9);

const asText = (v: unknown): string => (typeof v === 'string' ? v : '');

function normalizePhotoBox(raw: any): PhotoBox | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const w = Number(raw.w);
  const h = Number(raw.h);
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) return null;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/**
 * JSON crudo del modelo → productos del editor.
 *
 * El `priceType` que devuelve la IA se descarta a propósito: el formato se
 * deriva de qty/dollars/cents en `price.ts`, así que una mala clasificación del
 * modelo no llega al cartón.
 */
export function toProducts(raw: unknown[] | undefined): ShelfSignProduct[] {
  return (raw || [])
    .map((item: any): ShelfSignProduct => ({
      id: uid(),
      name: asText(item?.name),
      details: asText(item?.details),
      name2: asText(item?.name2),
      details2: asText(item?.details2),
      qty: clampQty(item?.qty),
      dollars: clampDollars(item?.dollars),
      cents: clampCents(item?.cents),
      unit: clampUnit(item?.unit),
      regularPrice: asText(item?.regularPrice),
      save: asText(item?.save),
      conditions: asText(item?.conditions),
      photo: null,
      photoBox: normalizePhotoBox(item?.photoBox),
    }))
    .map(withComputedSave)
    .map(dedupeShared);
}

/**
 * Rellena "Save" cuando el flyer traía el regular price pero no el ahorro.
 *
 * Sólo cuando está vacío: si el flyer imprime su propio texto de ahorro, ese
 * gana — es el que el cliente va a comparar contra la góndola. Y si no hay
 * regular price no se inventa nada.
 */
function withComputedSave(p: ShelfSignProduct): ShelfSignProduct {
  if (p.save.trim()) return p;
  const save = computeSave(p);
  return save ? { ...p, save } : p;
}

/**
 * Atributos compartidos ("MINIMUM 1 LB", "LIMIT 1 OFFER PER FAMILY") repetidos
 * en details, details2 y conditions: quedan UNA sola vez, en conditions.
 *
 * Se aplica siempre post-extracción — en un mix & match el modelo tiende a
 * repetir la condición bajo cada producto y el cartón queda con la misma línea
 * tres veces.
 */
export function dedupeShared(p: ShelfSignProduct): ShelfSignProduct {
  const norm = (l: string) => l.trim().toUpperCase();
  const lines = (t: string) => (t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const uniq = (arr: string[]) =>
    arr.filter((l, i) => arr.findIndex((x) => norm(x) === norm(l)) === i);

  let d1 = uniq(lines(p.details));
  let d2 = uniq(lines(p.details2));
  const cond = uniq(lines(p.conditions));

  if (p.name2) {
    const shared = d1.filter((l) => d2.some((x) => norm(x) === norm(l)));
    if (shared.length) {
      d1 = d1.filter((l) => !shared.some((x) => norm(x) === norm(l)));
      d2 = d2.filter((l) => !shared.some((x) => norm(x) === norm(l)));
      shared.forEach((l) => {
        if (!cond.some((x) => norm(x) === norm(l))) cond.push(l);
      });
    }
  }

  d1 = d1.filter((l) => !cond.some((x) => norm(x) === norm(l)));
  d2 = d2.filter((l) => !cond.some((x) => norm(x) === norm(l)));

  return { ...p, details: d1.join('\n'), details2: d2.join('\n'), conditions: cond.join('\n') };
}

/**
 * Una línea de texto libre → un cartón.
 * Reconoce: "JUMBO WHITE EGGS 3/$5" · "POLLO $2.29 LB" · "JUGO 2/95¢" · "49¢"
 */
export function parseManualLine(line: string): ShelfSignProduct | null {
  const t = line.trim();
  if (!t) return null;

  let qty = 1;
  let dollars = 0;
  let cents = 0;
  let rest = t;
  let m: RegExpMatchArray | null;

  if (/¢/.test(t)) {
    const multi = t.match(/(\d+)\s*\/\s*(\d+)\s*¢/);
    if (multi) {
      qty = Math.max(1, Number(multi[1]));
      cents = Number(multi[2]);
      rest = t.replace(multi[0], ' ');
    } else if ((m = t.match(/(\d+)\s*¢/))) {
      cents = Number(m[1]);
      rest = t.replace(m[0], ' ');
    }
  } else if ((m = t.match(/(\d+)\s*\/\s*\$?\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    qty = Math.max(1, Number(m[1]));
    dollars = Number(m[2]);
    cents = m[3] ? Number(m[3].padEnd(2, '0')) : 0;
    rest = t.replace(m[0], ' ');
  } else if ((m = t.match(/\$\s*(\d+)(?:[.,](\d{1,2}))?/))) {
    dollars = Number(m[1]);
    cents = m[2] ? Number(m[2].padEnd(2, '0')) : 0;
    rest = t.replace(m[0], ' ');
  }

  const unitMatch = rest.match(/\b(LB|EA)\b/i);
  const unit = unitMatch ? (unitMatch[1].toUpperCase() as 'LB' | 'EA') : '';
  if (unitMatch) rest = rest.replace(unitMatch[0], ' ');

  const name =
    rest
      .replace(/[|;,\-]+\s*$/, '')
      .replace(/^\s*[|;,\-]+/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .toUpperCase() || 'PRODUCTO';

  return {
    id: uid(),
    name,
    details: '',
    name2: '',
    details2: '',
    qty: clampQty(qty),
    dollars: clampDollars(dollars),
    cents: clampCents(cents),
    unit,
    regularPrice: '',
    save: '',
    conditions: '',
    photo: null,
    photoBox: null,
  };
}
