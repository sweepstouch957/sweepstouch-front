// Run: npm run test:perf
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  _setEnabledForTest,
  buildReport,
  clearPerf,
  normalize,
  recordApi,
  recordRender,
} from './monitor.ts';

test('normalize agrupa ids, números y códigos de tienda', () => {
  assert.equal(
    normalize('/stores/64b7f0c2a1b2c3d4e5f60718/customers?page=2'),
    '/stores/:id/customers'
  );
  assert.equal(normalize('/campaigns/123/logs'), '/campaigns/:n/logs');
  assert.equal(normalize('/billing/MER-12345'), '/billing/:code');
});

test('apagado no guarda nada', () => {
  _setEnabledForTest(false);
  clearPerf();
  recordApi({ route: '/a', method: 'GET', endpoint: '/x', ms: 10, status: 200, bytes: 1 });
  assert.deepEqual(buildReport(), []);
});

test('reporte: p95, errores, ráfagas y orden por la página más lenta', () => {
  _setEnabledForTest(true);
  clearPerf();
  for (let i = 0; i < 6; i++)
    recordApi({
      route: '/admin/rapida',
      method: 'GET',
      endpoint: '/stores',
      ms: 100,
      status: 200,
      bytes: 2048,
    });
  recordApi({
    route: '/admin/lenta',
    method: 'GET',
    endpoint: '/customers/count',
    ms: 3000,
    status: 200,
    bytes: 100,
  });
  recordApi({
    route: '/admin/lenta',
    method: 'POST',
    endpoint: '/x',
    ms: 50,
    status: 500,
    bytes: 10,
  });
  recordRender(120);

  const [first, second] = buildReport();
  assert.equal(first.route, '/admin/lenta');
  assert.equal(first.slowest[0].endpoint, '/customers/count');
  assert.equal(first.slowest[0].p95, 3000);
  assert.equal(first.slowest.find((e) => e.method === 'POST').errors, 1);
  assert.equal(second.route, '/admin/rapida');
  assert.equal(second.slowest[0].count, 6);
  assert.equal(second.slowest[0].burst5s, 6); // 6 llamadas iguales en 5 s → re-consulta en bucle
  assert.equal(second.slowest[0].kb, 2);
});
