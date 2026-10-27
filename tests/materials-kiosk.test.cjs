const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative) {
  const filename = path.resolve(relative);
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = compiled.require.bind(compiled);
  compiled.require = (name) => name === './materials-utils'
    ? load('src/app/admin/management/support/materials/materials-utils.ts')
    : originalRequire(name);
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  return compiled.exports;
}

const { collectInstalledKioskTablets, matchesKioskTablet } = load('src/app/admin/management/support/materials/materials-kiosk-utils.ts');
const shop = (id, overrides = {}) => ({ id, _id: id, store: id, nombre: `Tienda ${id}`, direccion: 'Main St', ciudad: 'Bronx', estado: 'NY', zip: '00123', ...overrides });
const tablet = (id, overrides = {}) => ({ identifier: id, name: `Caja ${id}`, imei: `0350000000000${id}`, serial: `SN-${id}`, ...overrides });

test('store requests are limited to four concurrent calls and all results are collected', async () => {
  let running = 0;
  let maximum = 0;
  const result = await collectInstalledKioskTablets(Array.from({ length: 9 }, (_, index) => shop(String(index))), async id => {
    running++;
    maximum = Math.max(maximum, running);
    await new Promise(resolve => setTimeout(resolve, 5));
    running--;
    return [tablet(id)];
  });
  assert.equal(maximum, 4);
  assert.equal(result.rows.length, 9);
  assert.equal(result.failedStores.length, 0);
});

test('duplicate store links are fetched once and shared device identifiers appear once', async () => {
  const calls = [];
  const result = await collectInstalledKioskTablets([shop('a'), shop('duplicate', { store: 'a' }), shop('b'), shop('legacy', { store: null })], async id => {
    calls.push(id);
    return [tablet('same-device')];
  });
  assert.deepEqual(calls.sort(), ['a', 'b']);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].stores.length, 2);
});

test('a failed store does not hide successful tablets, including unnamed devices', async () => {
  const result = await collectInstalledKioskTablets([shop('ok'), shop('failed')], async id => {
    if (id === 'failed') throw new Error('Service unavailable');
    return [tablet('1', { name: undefined }), tablet('2')];
  });
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.failedStores.map(store => store.id), ['failed']);
});

test('tablets are searchable by IMEI, serial, device, store and accented address', async () => {
  const result = await collectInstalledKioskTablets([shop('a', { nombre: 'Mercado José', direccion: 'Av. Unión' })], async () => [tablet('1')]);
  const row = result.rows[0];
  for (const query of ['', '03500000000001', 'SN-1', 'Caja 1', 'jose union', 'bronx', '00123']) assert.equal(matchesKioskTablet(row, query), true, query);
  assert.equal(matchesKioskTablet(row, 'otra tienda'), false);
});

test('cancellation stops the remaining store requests', async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(collectInstalledKioskTablets(Array.from({ length: 8 }, (_, index) => shop(String(index))), async id => {
    calls++;
    controller.abort();
    return [tablet(id)];
  }, controller.signal), { name: 'AbortError' });
  assert.equal(calls, 1);
});
