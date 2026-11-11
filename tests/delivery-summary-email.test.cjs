const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('delivery summary uses its own endpoint and preserves optional backend defaults', async () => {
  const calls = [];
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('src/services/campaign-delivery-summary.service.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: () => ({ api: { post: async (...args) => {
    calls.push(args);
    return { data: { ok: true, campaignsCount: 2 } };
  } } }) });
  const response = await exports.sendCampaignDeliverySummary({ storeId: 'store-a', to: ' user@example.com ', subject: ' Campaign Report ', contact_name: '', support_phone: '' });
  assert.equal(calls[0][0], '/mail/campaign-delivery-summary/send');
  assert.equal(calls[0][1].to, 'user@example.com');
  assert.equal(calls[0][1].subject, 'Campaign Report');
  assert.equal('contact_name' in calls[0][1], false);
  assert.equal('support_phone' in calls[0][1], false);
  assert.equal('sorteo_winner' in calls[0][1], false);
  assert.equal(calls[0][2].withCredentials, false);
  assert.equal('startDate' in calls[0][1], false);
  assert.equal('endDate' in calls[0][1], false);
  assert.equal(response.campaignsCount, 2);
  await exports.sendCampaignDeliverySummary({ storeId: 'store-b', to: 'b@example.com', subject: 'Report', contact_name: ' José ', support_phone: ' 123 ', other_services: [{ name: ' Design ', cost: 12.5 }] });
  assert.equal(calls[1][1].contact_name, 'José');
  assert.equal(calls[1][1].support_phone, '123');
  assert.equal(calls[1][1].other_services[0].name, 'Design');
  assert.equal(calls[1][1].other_services[0].cost, 12.5);
  await exports.sendCampaignDeliverySummary({ storeId: 'store-c', to: 'c@example.com', subject: 'Report', startDate: '2026-10-01', endDate: '2026-11-01', timeZone: 'America/New_York' });
  assert.equal(calls[2][1].startDate, '2026-10-01');
  assert.equal(calls[2][1].endDate, '2026-11-01');
  assert.equal(calls[2][1].timeZone, 'America/New_York');
});
