import type { CalendarEvent, EventPayload } from '@/services/calendar.service';
import { COUNTRIES, YEAR } from './data';

export const HTML_HOLIDAYS: EventPayload[] = COUNTRIES.flatMap((country) =>
  country.hs.map(([month, day, title]) => {
    const date = `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      title,
      date,
      type: 'feriado' as const,
      status: 'confirmado' as const,
      calendarScope: 'holiday' as const,
      holidayCountryId: country.id,
      holidayImportKey: `html-${YEAR}-${country.id}-${date}`,
      description: '',
      notify: false,
    };
  })
);

export function pendingHolidays(events: CalendarEvent[]) {
  const imported = new Set(
    events
      .filter((event) => event.calendarScope === 'holiday')
      .map((event) => event.holidayImportKey)
  );
  return HTML_HOLIDAYS.filter((event) => !imported.has(event.holidayImportKey));
}

// Sequential writes keep load bounded. A fresh feed makes retries resume after partial failures.
export async function importHtmlHolidays(
  api: {
    feed: (from: string, to: string) => Promise<CalendarEvent[]>;
    create: (payload: EventPayload) => Promise<CalendarEvent>;
  },
  onSaved: (event: CalendarEvent) => void
) {
  const existing = await api.feed(`${YEAR}-01-01`, `${YEAR}-12-31`);
  const missing = pendingHolidays(existing);
  for (const payload of missing) onSaved(await api.create(payload));
  return missing.length;
}
