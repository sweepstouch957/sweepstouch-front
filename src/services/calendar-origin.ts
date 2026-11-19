// The current API persists descriptions but has no calendar scope field.
// Keep the origin in a versioned envelope and remove it before displaying text.
export const HOLIDAY_CALENDAR_MARKER = '<!-- sweepstouch:calendar=holiday:v1 -->';
export type CalendarScope = 'general' | 'holiday';
export type HolidayMetadata = {
  holidayCountryId?: string;
  holidayCountryIds?: string[];
  holidayImportKey?: string;
};

export function getHolidayCountryIds(event: HolidayMetadata): string[] {
  return event.holidayCountryIds !== undefined
    ? [...new Set(event.holidayCountryIds.filter((id) => typeof id === 'string' && id.length > 0))]
    : event.holidayCountryId
      ? [event.holidayCountryId]
      : [];
}
const META_PREFIX = '<!-- sweepstouch:holiday-meta:';

export function readCalendarOrigin<T extends { description?: string }>(
  event: T
): T & { calendarScope: CalendarScope } & HolidayMetadata {
  const description = event.description ?? '';
  const holiday =
    description === HOLIDAY_CALENDAR_MARKER ||
    description.startsWith(`${HOLIDAY_CALENDAR_MARKER}\n`);
  let text = holiday
    ? description.slice(HOLIDAY_CALENDAR_MARKER.length).replace(/^\n/, '')
    : description;
  let metadata: HolidayMetadata = {};
  if (holiday && text.startsWith(META_PREFIX)) {
    const end = text.indexOf(' -->');
    if (end !== -1) {
      try {
        const parsed = JSON.parse(decodeURIComponent(text.slice(META_PREFIX.length, end)));
        if (typeof parsed.holidayCountryId === 'string')
          metadata.holidayCountryId = parsed.holidayCountryId;
        if (Array.isArray(parsed.holidayCountryIds))
          metadata.holidayCountryIds = getHolidayCountryIds({
            holidayCountryIds: parsed.holidayCountryIds,
          });
        if (typeof parsed.holidayImportKey === 'string')
          metadata.holidayImportKey = parsed.holidayImportKey;
        text = text.slice(end + 4).replace(/^\n/, '');
      } catch {
        /* Keep malformed metadata visible rather than discard user text. */
      }
    }
  }
  return {
    ...event,
    ...metadata,
    calendarScope: holiday ? 'holiday' : 'general',
    description: text,
  };
}

export function writeCalendarOrigin<
  T extends { description?: string; calendarScope?: CalendarScope } & HolidayMetadata,
>(payload: T): Omit<T, 'calendarScope' | keyof HolidayMetadata> {
  const { calendarScope, holidayCountryId, holidayCountryIds, holidayImportKey, ...body } = payload;
  if (calendarScope !== 'holiday') return body;
  const decoded = readCalendarOrigin(payload);
  const metadata = {
    holidayCountryId: holidayCountryId ?? decoded.holidayCountryId,
    holidayCountryIds: holidayCountryIds ?? decoded.holidayCountryIds,
    holidayImportKey: holidayImportKey ?? decoded.holidayImportKey,
  };
  const extra =
    metadata.holidayCountryId || metadata.holidayCountryIds?.length || metadata.holidayImportKey
      ? `${META_PREFIX}${encodeURIComponent(JSON.stringify(metadata))} -->\n`
      : '';
  return {
    ...body,
    description: `${HOLIDAY_CALENDAR_MARKER}\n${extra}${decoded.description ?? ''}`,
  };
}
