// Pruebas de las reglas de negocio del tab Circular & Listas (capa domain/, sin React).
// Run: npm run test:domain
// Sin dependencias: Node quita los tipos (--experimental-strip-types) y este hook resuelve los
// imports relativos sin extensión que usa el resto del código ('./prices' → './prices.ts').
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';

register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(s, c, next) {
        if (s.startsWith('.') && !/\\.[a-z]+$/i.test(s)) return next(s + '.ts', c);
        return next(s, c);
      }`
    )
);

const { isFlyer, pickCurrent, splitStoreCirculars, pickTodayAndNext, diffProducts, directImageOf } =
  await import('./circulars.ts');
const { buildUpcomingSummary, missingRegularOf, isGeneratingImage, fineText } = await import(
  './catalog.ts'
);
const { jobsNeedingAttention, hasActiveJobs } = await import('./import-jobs.ts');
const { bannerStatus } = await import('./banners.ts');
const { validRange, isBadRange } = await import('./dates.ts');
const { digits, prettyPhone, validateListsPhone, validateListsLink } = await import('./phone.ts');
const { parsePriceNum, regularFromPrice } = await import('./prices.ts');
const { errMsg } = await import('./errors.ts');

const circ = (o) => ({ status: 'active', startDate: '', endDate: '', ...o });
const DAY = 86_400_000;
const NOW = Date.parse('2026-11-15T12:00:00Z');
const iso = (offsetDays) => new Date(NOW + offsetDays * DAY).toISOString();

test('isFlyer: arte de campaña sí, PDF semanal no', () => {
  assert.equal(isFlyer({ campaign: 'c1' }), true);
  assert.equal(isFlyer({ fileKey: 'campaign' }), true);
  assert.equal(isFlyer({ fileKey: 'circulars/x.pdf' }), false);
});

test('pickCurrent: activo > agendado > cualquiera', () => {
  const list = [circ({ _id: 'a', status: 'expired' }), circ({ _id: 'b', status: 'scheduled' })];
  assert.equal(pickCurrent(list)._id, 'b');
  assert.equal(pickCurrent([...list, circ({ _id: 'c', status: 'active' })])._id, 'c');
  assert.equal(pickCurrent([circ({ _id: 'z', status: 'expired' })])._id, 'z');
  assert.equal(pickCurrent([]), undefined);
});

test('splitStoreCirculars: separa flyers y nunca toma uno vencido como vigente', () => {
  const r = splitStoreCirculars([
    circ({ _id: 'old', status: 'expired' }),
    circ({ _id: 'fly', status: 'active', campaign: 'c1' }),
  ]);
  assert.deepEqual(
    r.flyers.map((c) => c._id),
    ['fly']
  );
  assert.equal(r.current, null);
  assert.equal(r.hasCurrent, false);
  assert.equal(r.top._id, 'old');
});

test('pickTodayAndNext: el flyer vivo gana al circular, y "después" es el más cercano', () => {
  const weekly = circ({ _id: 'weekly', startDate: iso(-2), endDate: iso(3) });
  const flyer = circ({ _id: 'flyer', campaign: 'c', startDate: iso(-1), endDate: iso(1) });
  const later = circ({ _id: 'later', status: 'scheduled', startDate: iso(9), endDate: iso(15) });
  const soon = circ({ _id: 'soon', status: 'scheduled', startDate: iso(4), endDate: iso(10) });
  const r = pickTodayAndNext([weekly, flyer, later, soon], NOW);
  assert.equal(r.current._id, 'flyer');
  assert.equal(r.next._id, 'soon');
  assert.equal(pickTodayAndNext([weekly], NOW).current._id, 'weekly');
  assert.deepEqual(pickTodayAndNext([], NOW), { current: null, next: null });
});

test('diffProducts: igual, cambia de precio, entra y sale (nombre normalizado)', () => {
  const d = diffProducts(
    [
      { name: 'Coca-Cola 2L', price: '$2.99' },
      { name: 'Pan', price: '$1' },
      { name: 'Leche', price: '$3' },
    ],
    [
      { name: 'coca cola 2l', price: '$2.99' },
      { name: 'Pan', price: '$1.25' },
      { name: 'Huevos', price: '$4' },
    ]
  );
  assert.equal(d.same, 1);
  assert.deepEqual(d.changed, [{ name: 'Pan', from: '$1', to: '$1.25' }]);
  assert.deepEqual(d.added, [{ name: 'Huevos', to: '$4' }]);
  assert.deepEqual(d.removed, [{ name: 'Leche', from: '$3' }]);
});

test('directImageOf: preview o archivo de imagen; un PDF no', () => {
  assert.equal(directImageOf({ previewImageUrl: 'p.png', fileUrl: 'x.pdf' }), 'p.png');
  assert.equal(directImageOf({ fileUrl: 'https://cdn/x.JPG?v=1' }), 'https://cdn/x.JPG?v=1');
  assert.equal(directImageOf({ fileUrl: 'https://cdn/x.pdf' }), '');
});

test('buildUpcomingSummary: agrupa por fecha, separa precios de nuevos, ordena', () => {
  const rows = buildUpcomingSummary([
    { effectiveFrom: '2026-11-20', effectiveKind: 'price', effectiveCircularTitle: 'Semana 47' },
    { effectiveFrom: '2026-11-18', effectiveKind: 'new' },
    { effectiveFrom: '2026-11-20', effectiveKind: 'new' },
    { name: 'sin fecha' },
  ]);
  assert.deepEqual(rows, [
    { date: '2026-11-18', title: '', total: 1, nuevos: 1, precios: 0 },
    { date: '2026-11-20', title: 'Semana 47', total: 2, nuevos: 1, precios: 1 },
  ]);
});

test('missingRegularOf: oferta sin regular y con precio calculable', () => {
  const r = missingRegularOf([
    { _id: 1, price: '$2.00', originalPrice: '' },
    { _id: 2, price: '$2.00', originalPrice: '$2.50' },
    { _id: 3, price: '', originalPrice: '' },
  ]);
  assert.deepEqual(
    r.map((p) => p._id),
    [1]
  );
});

test('isGeneratingImage: sólo mientras limpia y la foto es cruda o falta', () => {
  assert.equal(isGeneratingImage({ imageUrl: 'https://x/circular-products/a.png' }, true), true);
  assert.equal(isGeneratingImage({ imageUrl: '' }, true), true);
  assert.equal(isGeneratingImage({ imageUrl: 'https://x/clean/a.png' }, true), false);
  assert.equal(isGeneratingImage({ imageUrl: '' }, false), false);
});

test('fineText: caja, mostrador y condición, en ese orden', () => {
  assert.equal(
    fineText({ pending: { packQty: 12, packUnit: 'u' }, counterOnly: true, offerCondition: 'Con tarjeta' }),
    'Caja 12 u · Mostrador · Con tarjeta'
  );
  assert.equal(fineText({ pending: { packQty: 1 } }), '');
});

test('jobsNeedingAttention: fallidos, corriendo o esperando cuota más de un minuto', () => {
  const jobs = [
    { _id: 'f', status: 'failed' },
    { _id: 'r', status: 'running' },
    { _id: 'q-now', status: 'queued', runAfter: new Date(NOW + 30_000).toISOString() },
    { _id: 'q-late', status: 'queued', runAfter: new Date(NOW + 5 * 60_000).toISOString() },
    { _id: 'd', status: 'done' },
  ];
  assert.deepEqual(
    jobsNeedingAttention(jobs, NOW).map((j) => j._id),
    ['f', 'r', 'q-late']
  );
  assert.equal(hasActiveJobs(jobs), true);
  assert.equal(hasActiveJobs([{ status: 'done' }]), false);
  assert.equal(hasActiveJobs(), false);
});

test('bannerStatus: vigente, programado, vencido o tapado', () => {
  const b = (o) => ({ _id: 'b', startDate: iso(-1), endDate: iso(1), ...o });
  assert.equal(bannerStatus(b(), 'b', NOW).label, 'Vigente');
  assert.equal(bannerStatus(b({ startDate: iso(2), endDate: iso(5) }), 'x', NOW).label, 'Programado');
  assert.equal(bannerStatus(b({ startDate: iso(-5), endDate: iso(-2) }), 'x', NOW).label, 'Vencido');
  assert.equal(bannerStatus(b(), 'otro', NOW).label, 'Tapado por uno más nuevo');
});

test('validRange / isBadRange', () => {
  assert.equal(validRange('2026-11-01', '2026-11-01'), true);
  assert.equal(validRange('2026-11-02', '2026-11-01'), false);
  assert.equal(validRange('', '2026-11-01'), false);
  assert.equal(isBadRange('2026-11-02', '2026-11-01'), true);
  assert.equal(isBadRange('', '2026-11-01'), false);
});

test('teléfono y link de las listas', () => {
  assert.equal(digits('(718) 293-3032'), '7182933032');
  assert.equal(prettyPhone('17182933032'), '(718) 293-3032');
  assert.equal(prettyPhone('123'), '123');
  assert.equal(validateListsPhone(''), true);
  assert.equal(validateListsPhone('718 293 3032'), true);
  assert.equal(validateListsPhone('1-718-293-3032'), true);
  assert.equal(validateListsPhone('2933032'), 'Número de 10 dígitos');
  assert.equal(validateListsLink('tienda.com/lista'), true);
  assert.equal(validateListsLink('https://tienda.com'), true);
  assert.equal(validateListsLink('no es link'), 'Link inválido');
});

test('precios del flyer: unidad y regular estimado (× 1.25)', () => {
  assert.equal(parsePriceNum('$2.99'), 2.99);
  assert.equal(parsePriceNum('99¢/lb'), 0.99);
  assert.equal(parsePriceNum('2/$5'), 2.5);
  assert.equal(parsePriceNum(''), 0);
  assert.equal(regularFromPrice('$2.00'), '$2.50');
  assert.equal(regularFromPrice('gratis'), null);
});

test('errMsg: error del servidor > mensaje > respaldo', () => {
  assert.equal(errMsg({ response: { data: { error: 'Sin cuota' } }, message: 'x' }, 'f'), 'Sin cuota');
  assert.equal(errMsg(new Error('timeout'), 'f'), 'timeout');
  assert.equal(errMsg(null, 'No se pudo'), 'No se pudo');
});
