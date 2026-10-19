import type { Circular } from '@/services/circular.service';

export type SourceKind = 'Flyer' | 'Circular';
export type MessageSource = { c: Circular; kind: SourceKind };

/** Sólo se marcan los que rigen o van a regir; el resto va sin píldora. */
export const SOURCE_STATUS: Record<string, { label: string; color: 'success' | 'info' | 'default' }> =
  {
    active: { label: 'Vigente', color: 'success' },
    scheduled: { label: 'Agendado', color: 'info' },
  };

/** "14 oct": fecha corta del rango del flyer/circular (guardada como día UTC). */
export const fmtShortDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    : '';
