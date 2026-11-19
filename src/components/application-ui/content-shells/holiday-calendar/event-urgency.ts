export type EventUrgency = 'green' | 'yellow' | 'red' | 'neutral';

const businessDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Tegucigalpa',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getBusinessDate(now = new Date()): string {
  const parts = businessDate.formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function daysUntilEvent(date: string, today: string): number {
  // Compare civil dates in UTC so daylight-saving changes cannot shift the threshold.
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000
  );
}

export function eventUrgency(date: string, today: string): EventUrgency {
  const days = daysUntilEvent(date, today);
  if (days >= 0 && days <= 8) return 'red';
  if (days >= 9 && days <= 15) return 'yellow';
  if (days >= 16 && days <= 30) return 'green';
  return 'neutral';
}
