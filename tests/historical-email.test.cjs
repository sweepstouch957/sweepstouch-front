const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('historical report sends a full-history date range; weekly report keeps backend defaults', async () => {
  const calls = [];
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/services/mail.service.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-19T23:59:00Z'])); }
  }
  vm.runInNewContext(source, {
    exports, Date: FixedDate,
    require: () => ({ api: { post: async (...args) => { calls.push(args); return { data: { ok: true } }; } } }),
  });
  const input = { storeId: 'store-a', to: ' user@example.com ', subject: 'Campaign Report', sorteo_winner: 'pendiente' };
  await exports.sendHistoricalCampaignEmail(input);
  assert.equal(calls[0][0], '/mail/database-status/send');
  assert.equal(calls[0][1].storeId, 'store-a');
  assert.equal(calls[0][1].to, 'user@example.com');
  assert.equal(calls[0][1].startDate, '1970-01-01');
  assert.equal(calls[0][1].endDate, '2026-10-20');
  assert.equal(calls[0][1].timeZone, 'UTC');
  await exports.sendCampaignEmail(input);
  assert.equal('startDate' in calls[1][1], false);
  assert.equal('endDate' in calls[1][1], false);
});
