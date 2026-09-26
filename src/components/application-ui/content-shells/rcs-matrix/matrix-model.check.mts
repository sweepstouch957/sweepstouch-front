// node --experimental-strip-types src/components/application-ui/content-shells/rcs-matrix/matrix-model.check.mts
import assert from 'node:assert';
import {
  buildQueues,
  computeKpis,
  filterRows,
  groupByStore,
  mergeRows,
  mergeStores,
  queueOf,
  uniqueByPhone,
  waitingMinutes,
} from './matrix-model.ts';

const base = {
  pickupAt: null,
  storeId: '',
  storePhone: '',
  customerId: '',
  customerName: '',
  paymentStatus: '',
  deliveryMethod: 'pickup' as const,
  address: '',
  itemCount: 1,
  subtotalCents: 0,
  refundTotalCents: 0,
};
const order = (id: string, at: string, status: string, cents: number, extra = {}) => ({
  ...base,
  _id: id,
  orderNumber: `ORD-${id}`,
  createdAt: at,
  storeSlug: 'super-31',
  storeName: 'Super Supermarket 31 Memorial Dr',
  customerPhone: `+1201555000${id.slice(-1)}`,
  fulfillmentStatus: status as any,
  subtotalCents: cents,
  ...extra,
});
const list = (id: string, at: string, status: string, extra = {}) => ({
  ...base,
  kind: 'list' as const,
  _id: id,
  orderNumber: `SL-${id}`,
  createdAt: at,
  storeSlug: 'super-31',
  storeName: 'Super Supermarket 31 Memorial Dr, Paterson',
  customerPhone: '+12018937819',
  customerName: 'carolina reyes',
  fulfillmentStatus: status as any,
  pointsAwarded: 40,
  ...extra,
});

const rows = mergeRows(
  [order('o1', '2026-09-25T13:00:00Z', 'awaiting_payment', 829), order('o2', '2026-09-25T15:00:00Z', 'completed', 2000, { paymentStatus: 'succeeded' })],
  [list('l1', '2026-09-25T14:00:00Z', 'list_pending'), list('l2', '2026-09-24T14:00:00Z', 'list_validated')],
  undefined
);
assert.deepEqual(rows.map((r) => r._id), ['o2', 'l1', 'o1', 'l2'], 'más nuevo primero');

const k = computeKpis(rows);
assert.equal(k.total, 4);
assert.equal(k.orders, 2);
assert.equal(k.lists, 2);
assert.equal(k.pending, 2, 'orden sin pagar + lista vigente');
assert.equal(k.unpaid, 1);
assert.equal(k.unpaidCents, 829);
assert.equal(k.grossCents, 2829);
assert.equal(k.collectedCents, 2000);
assert.equal(k.avgTicketCents, Math.round(2829 / 2));
assert.equal(k.listsValidated, 1);
assert.equal(k.points, 80);
assert.equal(k.stores, 1);

// Búsqueda "carolina" encuentra sus listas; sólo abiertas deja fuera la validada.
const waOf = () => 'unsent';
assert.equal(filterRows(rows, { q: 'carolina', onlyOpen: false, wa: 'all', waOf }).length, 2);
assert.equal(filterRows(rows, { q: 'carolina', onlyOpen: true, wa: 'all', waOf }).length, 1);
assert.equal(filterRows(rows, { q: '', onlyOpen: false, wa: '2', waOf }).length, 0);
assert.equal(filterRows(rows, { q: '', onlyOpen: false, wa: 'all', waOf }), rows, 'sin filtros no copia');

// Árbol: una rama por slug, con el nombre de la orden aunque la lista llegue primero.
const tree = groupByStore(rows);
assert.equal(tree.length, 1);
assert.equal(tree[0].rows.length, 4);
assert.equal(tree[0].storeName, 'Super Supermarket 31 Memorial Dr');

const stores = mergeStores(
  [{ key: 'x', storeId: '1', slug: 'super-31', name: 'Super', orders: 2 }],
  [{ key: 'super-31', storeId: '', slug: 'super-31', name: 'Super', orders: 2 }, { key: '', storeId: '', slug: '', name: '?', orders: 1 }]
);
assert.deepEqual(stores.map((s) => [s.slug, s.orders]), [['super-31', 4]]);

const key = (p: string) => p.replace(/\D/g, '').slice(-10);
assert.equal(uniqueByPhone(rows, key).length, 3, 'Carolina tiene 2 listas: un solo saludo');

// ── Cola de atención: qué falta hacer con cada solicitud ──
const paidRow = (id: string, at: string, reviewed: boolean) =>
  order(id, at, 'paid', 5000, { reviewed }) as any;
assert.equal(queueOf(paidRow('p1', '2026-09-25T12:00:00Z', false)), 'approve', 'pagada sin aprobar');
assert.equal(queueOf(paidRow('p2', '2026-09-25T12:00:00Z', true)), 'prepare', 'aprobada: armarla');
assert.equal(queueOf(order('r', '2026-09-25T12:00:00Z', 'ready', 100) as any), 'deliver');
assert.equal(queueOf(order('u', '2026-09-25T12:00:00Z', 'awaiting_payment', 100) as any), 'unpaid');
assert.equal(queueOf(order('c', '2026-09-25T12:00:00Z', 'completed', 100) as any), 'done');
assert.equal(queueOf({ ...(order('l', '2026-09-25T12:00:00Z', 'list_pending', 0) as any), kind: 'list' }), 'list');
assert.equal(queueOf({ ...(order('l2', '2026-09-25T12:00:00Z', 'list_validated', 0) as any), kind: 'list' }), 'done');

const now = Date.parse('2026-09-25T13:00:00Z');
assert.equal(waitingMinutes(paidRow('w', '2026-09-25T12:30:00Z', false), now), 30);

const queues = buildQueues(
  [paidRow('nueva', '2026-09-25T12:50:00Z', false), paidRow('vieja', '2026-09-25T12:00:00Z', false)],
  now
);
const approve = queues.find((q) => q.key === 'approve')!;
assert.equal(approve.rows.length, 2);
assert.equal(approve.rows[0]._id, 'vieja', 'primero lo que lleva mas tiempo esperando');
assert.equal(approve.oldestMinutes, 60);
assert.equal(approve.cents, 10000, 'la cola suma la plata que esta esperando');
assert.deepEqual(queues.map((q) => q.key), ['approve', 'prepare', 'deliver', 'unpaid', 'list', 'done']);

console.log('matrix-model.check ok');
