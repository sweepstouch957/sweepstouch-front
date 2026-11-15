/**
 * Reglas de negocio de circulares y flyers. Puro: sin React, sin MUI, sin HTTP.
 * Un "flyer" es el arte de una campaña; un "circular" es el PDF semanal de la tienda.
 */
import type { Circular } from '@/services/circular';

export type DiffRow = { name: string; from?: string; to?: string };
export type Diff = { same: number; changed: DiffRow[]; added: DiffRow[]; removed: DiffRow[] };
export type DiffKind = 'changed' | 'added' | 'removed';

/** El arte de una campaña NO es un circular: es un flyer (va aparte, en Automático). */
export const isFlyer = (c: Pick<Circular, 'campaign' | 'fileKey'>) =>
  !!c.campaign || c.fileKey === 'campaign';

/** Vigente primero, después el agendado, después el que haya. */
export const pickCurrent = <T extends Pick<Circular, 'status'>>(list: T[], ok = (_: T) => true) =>
  list.find((x) => x.status === 'active' && ok(x)) ||
  list.find((x) => x.status === 'scheduled' && ok(x)) ||
  list.find(ok);

/**
 * Circulares de una tienda separados de los flyers. Vigente = el activo; si no hay, el
 * próximo agendado (nunca uno vencido). "Arriba" cae al último si no hay vigente.
 */
export function splitStoreCirculars(all: Circular[]) {
  const items = all.filter((c) => !isFlyer(c));
  const flyers = all.filter(isFlyer);
  const current =
    items.find((c) => c.status === 'active') || items.find((c) => c.status === 'scheduled') || null;
  return { items, flyers, current, top: current || items[0] || null, hasCurrent: !!current };
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

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const keyOf = (p: any) => norm(p?.sku || p?.name);

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

/** Imagen directa del circular (sin pedirle al servidor que renderice el PDF). */
export const directImageOf = (c: Pick<Circular, 'previewImageUrl' | 'fileUrl'>) =>
  c.previewImageUrl || (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(c.fileUrl || '') ? c.fileUrl : '');
