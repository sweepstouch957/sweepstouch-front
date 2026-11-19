import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOLIDAY_CALENDAR_MARKER,
  readCalendarOrigin,
  writeCalendarOrigin,
} from './calendar-origin.ts';

test('general events keep their description and remain outside the holiday calendar', () => {
  const event = readCalendarOrigin({ description: 'Reunión del equipo' });
  assert.equal(event.calendarScope, 'general');
  assert.equal(event.description, 'Reunión del equipo');
});

test('holiday event origin survives storage and does not appear in displayed text', () => {
  const stored = writeCalendarOrigin({
    title: 'Celebración',
    description: 'Primera línea\nSegunda línea',
    calendarScope: 'holiday',
  });
  assert.equal('calendarScope' in stored, false);
  assert.ok(stored.description.startsWith(HOLIDAY_CALENDAR_MARKER));
  const loaded = readCalendarOrigin(stored);
  assert.equal(loaded.calendarScope, 'holiday');
  assert.equal(loaded.description, 'Primera línea\nSegunda línea');
  assert.equal(loaded.title, 'Celebración');
});

test('holiday events without descriptions still retain their origin', () => {
  const loaded = readCalendarOrigin(writeCalendarOrigin({ calendarScope: 'holiday' }));
  assert.equal(loaded.calendarScope, 'holiday');
  assert.equal(loaded.description, '');
});

test('repeated serialization does not duplicate the marker', () => {
  const once = writeCalendarOrigin({ description: 'Evento', calendarScope: 'holiday' });
  assert.deepEqual(writeCalendarOrigin({ ...once, calendarScope: 'holiday' }), once);
});

test('a marker mentioned within normal text does not change event origin', () => {
  const description = `Nota sobre ${HOLIDAY_CALENDAR_MARKER}`;
  assert.deepEqual(readCalendarOrigin({ description }), { description, calendarScope: 'general' });
});

test('updates without descriptions do not introduce or clear descriptions', () => {
  assert.deepEqual(writeCalendarOrigin({ status: 'confirmado' }), { status: 'confirmado' });
});

test('country and original import identity survive edits and serialization', () => {
  const payload = {
    description: 'Texto visible',
    calendarScope: 'holiday',
    holidayCountryId: 'br',
    holidayImportKey: 'html-2026-br-2026-11-20',
  };
  const stored = writeCalendarOrigin(payload);
  assert.equal('holidayCountryId' in stored, false);
  assert.equal('holidayImportKey' in stored, false);
  const loaded = readCalendarOrigin(stored);
  assert.equal(loaded.holidayCountryId, 'br');
  assert.equal(loaded.holidayImportKey, payload.holidayImportKey);
  assert.equal(loaded.description, payload.description);
  const edited = readCalendarOrigin(
    writeCalendarOrigin({ ...loaded, description: 'Nuevo texto', date: '2026-12-01' })
  );
  assert.equal(edited.holidayCountryId, 'br');
  assert.equal(edited.holidayImportKey, payload.holidayImportKey);
  assert.equal(edited.description, 'Nuevo texto');
});
