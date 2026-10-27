const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('src/app/admin/applications/email-test/bulk-send.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;

function harness(pages, send = async input => ({ ok: true, campaignId: input.storeId, result: [{ status: 'sent' }] })) {
  const calls = [];
  const searches = [];
  const storage = new Map();
  const states = [];
  let locked = false;
  let index = 0;
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    require: name => {
      if (name === 'react') return {
        useEffect: () => {},
        useRef: value => ({ current: value }),
        useState: value => {
          const slot = index++;
          states[slot] = value;
          return [value, next => { states[slot] = typeof next === 'function' ? next(states[slot]) : next; }];
        },
      };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === '@mui/material') return new Proxy({}, { get: (_, key) => key });
      if (name === 'axios') return { default: { isAxiosError: error => !!error.isAxiosError } };
      if (name.endsWith('store.service')) return { getStores: async params => {
        searches.push(params);
        const page = pages[params.page - 1];
        return { ...page, data: page.data.map(store => ({ status: 'active', ...store })) };
      } };
      if (name.endsWith('mail.service')) return { sendCampaignEmail: async input => { calls.push(input); return send(input); } };
      throw new Error(name);
    },
  });
  const tree = exports.default({
    userId: 'staff', busy: false,
    acquire: () => { if (locked) return false; locked = true; return true; },
    release: () => { locked = false; },
  });
  function findButton(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'Button' && node.props.variant === 'contained') return node;
    return [].concat(node.props?.children || []).map(findButton).find(Boolean);
  }
  return { run: findButton(tree).props.onClick, calls, searches, states };
}

test('paginates, deduplicates stores and sends only each store’s own email and ID', async () => {
  const store = (id, email) => ({ _id: id, name: id, address: 'Address', email });
  const app = harness([
    { total: 5, data: [store('a', ' a@example.com '), store('b', '')] },
    { total: 5, data: [store('a', 'a@example.com'), store('c', 'bad-email'), store('d', 'd@example.com')] },
  ]);
  await Promise.all([app.run(), app.run()]);
  assert.equal(app.searches.length, 2);
  assert.deepEqual(Array.from(app.calls, input => ({ ...input })), [
    { storeId: 'a', to: 'a@example.com', subject: 'Campaign Report', sorteo_winner: 'pendiente' },
    { storeId: 'd', to: 'd@example.com', subject: 'Campaign Report', sorteo_winner: 'pendiente' },
  ]);
  await app.run();
  assert.equal(app.calls.length, 2, 'a second click must not resend attempted stores');
});

test('an uncertain response stops the run and is never retried', async () => {
  const app = harness([{ total: 2, data: [
    { _id: 'a', name: 'A', email: 'a@example.com' },
    { _id: 'b', name: 'B', email: 'b@example.com' },
  ] }], async () => { throw { isAxiosError: true }; });
  await app.run();
  assert.equal(app.calls.length, 1);
  await app.run();
  assert.deepEqual(Array.from(app.calls, input => input.storeId), ['a', 'b']);
});

test('a failure while collecting stores sends no emails', async () => {
  const app = harness([{ total: 2, data: [{ _id: 'a', email: 'a@example.com' }] }, { total: 2, data: [] }]);
  await app.run();
  assert.equal(app.calls.length, 0);
  assert.match(app.states[2], /todas las tiendas/);
});

test('a store rejection does not prevent the next store receiving its own report', async () => {
  const app = harness([{ total: 2, data: [
    { _id: 'a', name: 'A', email: 'a@example.com' },
    { _id: 'b', name: 'B', email: 'b@example.com' },
  ] }], async input => {
    if (input.storeId === 'a') throw { isAxiosError: true, response: { status: 422, data: { result: [{ reject_reason: 'hard-bounce' }] } } };
    return { ok: true, campaignId: 'campaign-b', result: [{ status: 'queued' }] };
  });
  await app.run();
  assert.equal(app.calls.length, 2);
  assert.match(app.states[3][0].message, /hard-bounce/);
  assert.match(app.states[3][1].message, /En cola: b@example.com/);
});

test('a 503 shows configuration and provider details instead of a session error', async () => {
  const app = harness([{ total: 1, data: [{ _id: 'a', name: 'A', email: 'a@example.com' }] }], async () => {
    throw { isAxiosError: true, response: { status: 503, data: { error: 'mail_send_not_configured' } } };
  });
  await app.run();
  assert.match(app.states[2], /no está configurado/);
  assert.match(app.states[2], /mail_send_not_configured/);
  assert.match(app.states[2], /HTTP 503/);
  assert.doesNotMatch(app.states[2], /sesión/);
});

test('loads more than 100 active stores across every page', async () => {
  const stores = Array.from({ length: 205 }, (_, index) => ({ _id: String(index), name: `Store ${index}`, email: `store${index}@example.com`, status: 'active' }));
  const app = harness([0, 100, 200].map(offset => ({ total: 205, data: stores.slice(offset, offset + 100) })));
  await app.run();
  assert.equal(app.calls.length, 205);
  assert.deepEqual(Array.from(app.searches, query => query.page), [1, 2, 3]);
  assert.ok(app.searches.every(query => query.status === 'active'));
  assert.equal(new Set(app.calls.map(input => input.storeId)).size, 205);
  assert.match(app.states[1], /205 tiendas cargadas; 205 revisadas; 0 pendientes/);
});

test('does not send inactive, suspended, cancelled or unknown store statuses', async () => {
  const statuses = ['active', 'inactive', 'suspended', 'cancelled', 'unknown'];
  const app = harness([{ total: 5, data: statuses.map((status, index) => ({ _id: String(index), name: 'Store', email: `store${index}@example.com`, status, active: true })) }]);
  await app.run();
  assert.deepEqual(Array.from(app.calls, input => input.storeId), ['0']);
  assert.match(app.states[1], /4 tiendas omitidas/);
});

test('excludes the three stores that already received the report even without session history', async () => {
  const emails = ['keyfood.southstreet@gmail.com', ' KEYFOOD.HOLYOKE@gmail.com ', 'keyfood.chicopee@gmail.com', 'another@example.com'];
  const app = harness([{ total: 4, data: emails.map((email, index) => ({ _id: String(index), name: 'Store', email, status: 'active' })) }]);
  await app.run();
  assert.deepEqual(Array.from(app.calls, input => input.to), ['another@example.com']);
  assert.equal(app.states[3].filter(row => row.message.includes('exclusión solicitada')).length, 3);
});

test('matches backend active status rules for legacy stores and deactivated stores', async () => {
  const records = [
    { status: 'active', active: true },
    { status: undefined, active: true },
    { status: null, active: true },
    { status: '', active: true },
    { status: 'active', active: false },
    { status: undefined, active: false },
  ];
  const app = harness([{ total: records.length, data: records.map((record, index) => ({ _id: String(index), name: 'Store', email: `store${index}@example.com`, ...record })) }]);
  await app.run();
  assert.deepEqual(Array.from(app.calls, input => input.storeId), ['0', '1', '2', '3']);
  assert.match(app.states[1], /2 tiendas omitidas/);
});

test('a missing campaign returns 404 without stopping other stores', async () => {
  const app = harness([{ total: 2, data: [
    { _id: 'a', name: 'A', email: 'a@example.com' },
    { _id: 'b', name: 'B', email: 'b@example.com' },
  ] }], async input => {
    if (input.storeId === 'a') throw { isAxiosError: true, response: { status: 404, data: { error: 'report_campaign_not_found' } } };
    return { ok: true, campaignId: 'campaign-b', result: [{ status: 'sent' }] };
  });
  await app.run();
  assert.equal(app.calls.length, 2);
  assert.equal(app.states[2], '');
  assert.match(app.states[3][0].message, /período del reporte/);
});
