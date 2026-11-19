import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(
  'data:text/javascript,' +
    encodeURIComponent(`export async function resolve(s, c, next) {
  if (s.startsWith('.') && !/\\.[a-z]+$/i.test(s)) return next(s + '.ts', c);
  return next(s, c);
}`)
);
const { HTML_HOLIDAYS, pendingHolidays, importHtmlHolidays } = await import('./import-holidays.ts');

test('all 127 original holidays have unique durable identities, countries and silent creation', () => {
  assert.equal(HTML_HOLIDAYS.length, 127);
  assert.equal(new Set(HTML_HOLIDAYS.map((event) => event.holidayImportKey)).size, 127);
  assert.equal(new Set(HTML_HOLIDAYS.map((event) => event.holidayCountryId)).size, 10);
  for (const event of HTML_HOLIDAYS) {
    assert.equal(event.calendarScope, 'holiday');
    assert.equal(event.notify, false);
    assert.equal(event.status, 'confirmado');
  }
});

test('edited, moved and cancelled imported events are not imported again', () => {
  const existing = HTML_HOLIDAYS.map((event) => ({
    ...event,
    title: 'Edited',
    date: '2026-12-31',
    status: 'cancelado',
  }));
  assert.equal(pendingHolidays(existing).length, 0);
});

test('import uses a fresh backend feed and is repeatable without duplicates', async () => {
  const stored = [];
  let saved = 0;
  const api = {
    feed: async () => stored,
    create: async (payload) => {
      const event = { ...payload, _id: String(stored.length) };
      stored.push(event);
      return event;
    },
  };
  assert.equal(await importHtmlHolidays(api, () => saved++), 127);
  assert.equal(await importHtmlHolidays(api, () => saved++), 0);
  assert.equal(stored.length, 127);
  assert.equal(saved, 127);
});

test('failed imports keep saved events and a retry resumes with the missing ones', async () => {
  const stored = [];
  let fail = true;
  const api = {
    feed: async () => stored,
    create: async (payload) => {
      if (fail && stored.length === 3) throw new Error('Network unavailable');
      const event = { ...payload, _id: String(stored.length) };
      stored.push(event);
      return event;
    },
  };
  await assert.rejects(importHtmlHolidays(api, () => {}));
  assert.equal(stored.length, 3);
  fail = false;
  assert.equal(await importHtmlHolidays(api, () => {}), 124);
  assert.equal(stored.length, 127);
});
