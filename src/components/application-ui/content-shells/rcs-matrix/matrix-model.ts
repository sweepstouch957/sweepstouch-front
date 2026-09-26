/**
 * matrix-model.ts — Lógica pura de la Matriz RCS (sin React ni MUI).
 *
 * Todo lo que se deriva de las filas vive acá: juntar órdenes + listas, KPIs,
 * filtros y el árbol por tienda. El shell sólo compone. Chequeo ejecutable:
 *   node --experimental-strip-types src/components/application-ui/content-shells/rcs-matrix/matrix-model.check.mts
 *
 * Sólo imports de tipos: así corre en Node sin bundler.
 */
import type { MatrixRow, MatrixStore } from '@/services/rcs-matrix.service';

export type Range = { from: string; to: string };

/** Lo que todavía necesita una llamada. Lo demás ya está cerrado. */
export const OPEN_STATUSES: readonly string[] = [
  'awaiting_payment',
  'paid',
  'preparing',
  'ready',
  'list_pending',
];

const COLLECTED = ['succeeded', 'partially_refunded'];
const net = (r: MatrixRow) => r.subtotalCents - r.refundTotalCents;
const isList = (r: MatrixRow) => r.kind === 'list';

/** Órdenes y listas en una sola lista, lo más nuevo primero. */
export function mergeRows(...sources: (MatrixRow[] | undefined)[]): MatrixRow[] {
  return sources
    .flatMap((s) => s ?? [])
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** Tiendas de las dos fuentes, por slug (el mismo filtro sirve para ambas). */
export function mergeStores(...sources: (MatrixStore[] | undefined)[]): MatrixStore[] {
  const map = new Map<string, MatrixStore>();
  for (const s of sources.flatMap((x) => x ?? [])) {
    if (!s.slug) continue;
    const prev = map.get(s.slug);
    if (prev) prev.orders += s.orders;
    else map.set(s.slug, { ...s, key: s.slug });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface MatrixKpis {
  total: number;
  orders: number;
  lists: number;
  customers: number;
  stores: number;
  pending: number;
  unpaid: number;
  unpaidCents: number;
  grossCents: number;
  collectedCents: number;
  avgTicketCents: number;
  completed: number;
  cancelled: number;
  listsValidated: number;
  points: number;
  byStatus: Record<string, number>;
}

/** KPIs en UNA pasada sobre las filas. */
export function computeKpis(rows: MatrixRow[]): MatrixKpis {
  const k: MatrixKpis = {
    total: rows.length,
    orders: 0,
    lists: 0,
    customers: 0,
    stores: 0,
    pending: 0,
    unpaid: 0,
    unpaidCents: 0,
    grossCents: 0,
    collectedCents: 0,
    avgTicketCents: 0,
    completed: 0,
    cancelled: 0,
    listsValidated: 0,
    points: 0,
    byStatus: {},
  };
  const people = new Set<string>();
  const stores = new Set<string>();
  let liveCents = 0;
  let live = 0;

  for (const r of rows) {
    const st = r.fulfillmentStatus;
    k.byStatus[st] = (k.byStatus[st] || 0) + 1;
    const who = r.customerPhone || r.customerId;
    if (who) people.add(who);
    if (r.storeSlug) stores.add(r.storeSlug);
    if (OPEN_STATUSES.includes(st)) k.pending++;

    if (isList(r)) {
      k.lists++;
      k.points += r.pointsAwarded || 0;
      continue;
    }
    k.orders++;
    const cents = net(r);
    k.grossCents += cents;
    if (st === 'awaiting_payment') {
      k.unpaid++;
      k.unpaidCents += cents;
    }
    if (COLLECTED.includes(r.paymentStatus)) k.collectedCents += cents;
    if (st !== 'cancelled') {
      live++;
      liveCents += cents;
    }
  }

  k.customers = people.size;
  k.stores = stores.size;
  k.avgTicketCents = live ? Math.round(liveCents / live) : 0;
  k.completed = k.byStatus.completed || 0;
  k.cancelled = k.byStatus.cancelled || 0;
  k.listsValidated = k.byStatus.list_validated || 0;
  return k;
}

/** Texto que se busca: nombre, teléfono, orden/código, tienda, dirección. */
export function searchBlob(r: MatrixRow): string {
  return `${r.customerName} ${r.customerPhone} ${r.orderNumber} ${r.storeName} ${r.address}`.toLowerCase();
}

export interface RowFilters {
  q: string;
  onlyOpen: boolean;
  /** Estado de WhatsApp de la fila ('all' = sin filtro). */
  wa: string;
  waOf: (r: MatrixRow) => string;
}

export function filterRows(rows: MatrixRow[], f: RowFilters): MatrixRow[] {
  const needle = f.q.trim().toLowerCase();
  if (!needle && !f.onlyOpen && f.wa === 'all') return rows;
  return rows.filter(
    (r) =>
      (!needle || searchBlob(r).includes(needle)) &&
      (!f.onlyOpen || OPEN_STATUSES.includes(r.fulfillmentStatus)) &&
      (f.wa === 'all' || (!!r.customerPhone && f.waOf(r) === f.wa))
  );
}

export interface Branch {
  key: string;
  /** Nombre con dirección: el de una orden si hay (las listas lo arman igual). */
  storeName: string;
  rows: MatrixRow[];
}

/** Árbol por tienda (slug). Más gente arriba — ahí está el trabajo. */
export function groupByStore(rows: MatrixRow[]): Branch[] {
  const map = new Map<string, Branch>();
  const namedByOrder = new Set<string>();
  for (const r of rows) {
    const key = r.storeSlug || r.storeName || '—';
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, storeName: r.storeName, rows: [] }));
    b.rows.push(r);
    if (!isList(r) && !namedByOrder.has(key)) {
      namedByOrder.add(key);
      b.storeName = r.storeName;
    }
  }
  return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
}

/** Una fila por teléfono (el saludo es por persona, no por orden). */
export function uniqueByPhone(rows: MatrixRow[], phoneKey: (p: string) => string): MatrixRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = phoneKey(r.customerPhone);
    if (k.length < 10 || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '0%');

/* ══════════ Cola de atención (CRM de solicitudes) ══════════ */

/**
 * Qué falta hacer con una solicitud. El orden es el de la vida real: primero lo
 * que ya tiene plata del cliente y nadie miró, al final lo que sólo se mira.
 *
 *  approve  — pagada y sin aprobar: la tienda todavía no dijo que puede armarla
 *  prepare  — aprobada: hay que armarla
 *  deliver  — lista en el mostrador: falta entregarla
 *  unpaid   — se quedó en el checkout sin pagar: se la persigue
 *  list     — lista de compra vigente, sin pedido: se la empuja a comprar
 *  done     — cerrada (entregada, cancelada, lista validada o vencida)
 */
export type QueueKey = 'approve' | 'prepare' | 'deliver' | 'unpaid' | 'list' | 'done';

export const QUEUE_ORDER: readonly QueueKey[] = ['approve', 'prepare', 'deliver', 'unpaid', 'list', 'done'];

/** En qué cola cae la fila. Una sola regla, usada por los contadores y por la lista. */
export function queueOf(r: MatrixRow): QueueKey {
  if (isList(r)) return r.fulfillmentStatus === 'list_pending' ? 'list' : 'done';
  switch (r.fulfillmentStatus) {
    case 'awaiting_payment':
      return 'unpaid';
    case 'paid':
      return r.reviewed ? 'prepare' : 'approve';
    case 'preparing':
      return 'prepare';
    case 'ready':
      return 'deliver';
    default:
      return 'done';
  }
}

/** Minutos esperando desde que entró. Es el SLA que se ve en la cola. */
export function waitingMinutes(r: MatrixRow, now: number = Date.now()): number {
  const t = Date.parse(r.createdAt);
  return Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 60000)) : 0;
}

export interface QueueBucket {
  key: QueueKey;
  rows: MatrixRow[];
  cents: number;
  /** La más vieja sin atender, en minutos. Es lo que duele. */
  oldestMinutes: number;
}

/**
 * Filas agrupadas por lo que hay que hacer, cada grupo con lo más viejo primero:
 * en una cola de trabajo, lo urgente es lo que lleva más tiempo esperando.
 */
export function buildQueues(rows: MatrixRow[], now: number = Date.now()): QueueBucket[] {
  const map = new Map<QueueKey, QueueBucket>(
    QUEUE_ORDER.map((key) => [key, { key, rows: [], cents: 0, oldestMinutes: 0 }])
  );
  for (const r of rows) {
    const b = map.get(queueOf(r))!;
    b.rows.push(r);
    if (!isList(r)) b.cents += net(r);
  }
  for (const b of map.values()) {
    b.rows.sort((a, z) => (a.createdAt < z.createdAt ? -1 : a.createdAt > z.createdAt ? 1 : 0));
    b.oldestMinutes = b.rows.length ? waitingMinutes(b.rows[0], now) : 0;
  }
  return QUEUE_ORDER.map((k) => map.get(k)!);
}
