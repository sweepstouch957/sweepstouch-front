/** Comparativo hoy vs. lo que sigue: lógica pura (sin React). */
import type { Circular } from '@/services/circular.service';

export type DiffRow = { name: string; from?: string; to?: string };
export type Diff = { same: number; changed: DiffRow[]; added: DiffRow[]; removed: DiffRow[] };
export type DiffKind = 'changed' | 'added' | 'removed';

/** Filas que se muestran en la tabla; el resto se revisa en Próximos. */
export const MAX_ROWS = 60;

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const keyOf = (p: any) => norm(p?.sku || p?.name);

export const isFlyer = (c: Circular) => !!c.campaign || c.fileKey === 'campaign';

/** Producto por producto (nombre normalizado): sigue igual, cambia de precio, entra, sale. */
export function diffProducts(cur: any[], next: any[]): Diff {
  const a = new Map(cur.map((p) => [keyOf(p), p]));
  const b = new Map(next.map((p) => [keyOf(p), p]));
  const out: Diff = { same: 0, changed: [], added: [], removed: [] };
  for (const [k, p] of b) {
    const q = a.get(k);
    if (!q) out.added.push({ name: p.name, to: p.price });
    else if (norm(q.price) !== norm(p.price))
      out.changed.push({ name: p.name, from: q.price, to: p.price });
    else out.same += 1;
  }
  for (const [k, q] of a) if (!b.has(k)) out.removed.push({ name: q.name, from: q.price });
  return out;
}

/**
 * Hoy: regla de la lista (flyer de campaña vivo gana; si no, el circular semanal vigente).
 * Después: lo primero que arranca más adelante, sea flyer o circular.
 */
export function pickTodayAndNext(circulars: Circular[], now: number) {
  const all = circulars.filter((c) => ['active', 'scheduled'].includes(c.status));
  const live = all.filter((c) => Date.parse(c.startDate) <= now && Date.parse(c.endDate) >= now);
  const current = live.find(isFlyer) || live.find((c) => !isFlyer(c)) || null;
  const next =
    all
      .filter((c) => Date.parse(c.startDate) > now)
      .sort((x, y) => Date.parse(x.startDate) - Date.parse(y.startDate))[0] || null;
  return { current, next };
}
