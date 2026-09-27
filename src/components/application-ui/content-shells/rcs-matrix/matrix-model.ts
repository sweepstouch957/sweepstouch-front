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

/* ══════════ Agrupado por persona ══════════ */

/**
 * La cola se trabaja por PERSONA, no por orden: a alguien con dos pedidos y una
 * lista se le llama una vez, no tres. Cada persona cae en la cola de lo más
 * urgente que tenga abierto (una orden pagada sin aprobar pesa más que su lista).
 */
export interface PersonRow {
  /** Teléfono (últimos 10) o customerId. Es la identidad en la pantalla. */
  key: string;
  name: string;
  phone: string;
  storeSlug: string;
  storeName: string;
  /** Todo lo suyo, lo más nuevo primero. */
  rows: MatrixRow[];
  /** Lo más urgente que tiene abierto; decide en qué cola aparece. */
  queue: QueueKey;
  /** La fila que manda: la más vieja de esa cola. */
  lead: MatrixRow;
  orders: number;
  lists: number;
  /** Neto de sus órdenes (sin reembolsos). */
  cents: number;
  /** Minutos esperando de su fila más urgente. */
  waitMinutes: number;
}

/** Peso de cada cola: cuanto más bajo, más urgente. `done` no compite. */
const QUEUE_RANK: Record<QueueKey, number> = {
  approve: 0,
  prepare: 1,
  deliver: 2,
  unpaid: 3,
  list: 4,
  done: 5,
};

/** Identidad de la persona: el teléfono manda (el mismo cliente puede tener varios ids). */
export function personKey(r: MatrixRow): string {
  const digits = (r.customerPhone || '').replace(/\D/g, '');
  return digits ? digits.slice(-10) : r.customerId || r._id;
}

/**
 * Filas → personas. Cada una con su cola, su espera y el resumen de lo suyo.
 * Ordenadas por urgencia y, dentro de la misma cola, por quién espera hace más.
 */
export function groupByPerson(rows: MatrixRow[], now: number = Date.now()): PersonRow[] {
  const map = new Map<string, PersonRow>();
  for (const r of rows) {
    const key = personKey(r);
    const q = queueOf(r);
    let p = map.get(key);
    if (!p) {
      p = {
        key,
        name: r.customerName || 'Sin nombre',
        phone: r.customerPhone || '',
        storeSlug: r.storeSlug,
        storeName: r.storeName,
        rows: [],
        queue: q,
        lead: r,
        orders: 0,
        lists: 0,
        cents: 0,
        waitMinutes: 0,
      };
      map.set(key, p);
    }
    p.rows.push(r);
    if (!p.name || p.name === 'Sin nombre') p.name = r.customerName || p.name;
    if (!p.phone) p.phone = r.customerPhone || '';
    if (isList(r)) p.lists++;
    else {
      p.orders++;
      p.cents += net(r);
    }
    // Gana la cola más urgente; con la misma cola, la fila que lleva más tiempo.
    const better =
      QUEUE_RANK[q] < QUEUE_RANK[p.queue] ||
      (QUEUE_RANK[q] === QUEUE_RANK[p.queue] && r.createdAt < p.lead.createdAt);
    if (better) {
      p.queue = q;
      p.lead = r;
      // La tienda que se muestra es la del pendiente, no la de una compra vieja.
      p.storeSlug = r.storeSlug;
      p.storeName = r.storeName;
    }
  }
  const people = [...map.values()];
  for (const p of people) {
    p.rows.sort((a, z) => (a.createdAt < z.createdAt ? 1 : a.createdAt > z.createdAt ? -1 : 0));
    p.waitMinutes = waitingMinutes(p.lead, now);
  }
  return people.sort(
    (a, b) => QUEUE_RANK[a.queue] - QUEUE_RANK[b.queue] || b.waitMinutes - a.waitMinutes
  );
}

/** Personas por cola, en el orden de trabajo. Sólo devuelve las colas con gente. */
export function peopleByQueue(people: PersonRow[]): { key: QueueKey; people: PersonRow[] }[] {
  return QUEUE_ORDER.map((key) => ({ key, people: people.filter((p) => p.queue === key) })).filter(
    (b) => b.people.length > 0
  );
}

/** Tiendas con pendientes, para la columna izquierda: cuánta gente espera en cada una. */
export function storeLoad(people: PersonRow[]): { slug: string; name: string; people: number; urgent: number }[] {
  const map = new Map<string, { slug: string; name: string; people: number; urgent: number }>();
  for (const p of people) {
    if (!p.storeSlug) continue;
    const s = map.get(p.storeSlug) ?? { slug: p.storeSlug, name: p.storeName, people: 0, urgent: 0 };
    s.people++;
    if (p.queue === 'approve') s.urgent++;
    map.set(p.storeSlug, s);
  }
  return [...map.values()].sort((a, b) => b.urgent - a.urgent || b.people - a.people);
}
