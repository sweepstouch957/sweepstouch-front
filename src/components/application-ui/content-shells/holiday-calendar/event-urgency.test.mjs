import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntilEvent, eventUrgency, getBusinessDate } from './event-urgency.ts';

test('urgency uses inclusive boundaries and leaves past and distant dates neutral', () => {
  const today = '2026-11-19';
  for (const [date, expected] of [
    ['2026-11-18', 'neutral'],
    ['2026-11-19', 'red'],
    ['2026-11-27', 'red'],
    ['2026-11-28', 'yellow'],
    ['2026-12-04', 'yellow'],
    ['2026-12-05', 'green'],
    ['2026-12-19', 'green'],
    ['2026-12-20', 'neutral'],
  ])
    assert.equal(eventUrgency(date, today), expected, date);
});

test('counts calendar days across month, year, leap-day and daylight-saving boundaries', () => {
  assert.equal(daysUntilEvent('2026-12-08', '2026-11-19'), 19);
  assert.equal(daysUntilEvent('2026-01-01', '2025-12-31'), 1);
  assert.equal(daysUntilEvent('2028-03-01', '2028-02-28'), 2);
  assert.equal(daysUntilEvent('2026-03-09', '2026-03-07'), 2);
});

test('current date follows Honduras midnight rather than UTC midnight', () => {
  assert.equal(getBusinessDate(new Date('2026-11-20T05:59:59Z')), '2026-11-19');
  assert.equal(getBusinessDate(new Date('2026-11-20T06:00:00Z')), '2026-11-20');
});
