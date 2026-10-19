/** Helpers puros del banner de las listas: fechas en hora del Este, estado y valores del form. */
import type { StoreBanner } from '@/services/circular.service';

export const HISTORY_PREVIEW = 4;

const TZ = 'America/New_York';
/** ISO → "YYYY-MM-DD" en hora del Este (el fin de día guardado cae en el día siguiente en UTC). */
export const toDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }) : '';
const today = () => toDay(new Date().toISOString());
const plusDays = (n: number) => toDay(new Date(Date.now() + n * 86_400_000).toISOString());

export type BannerStatus = {
  label: string;
  color: 'success' | 'info' | 'default' | 'warning';
};

export const bannerStatus = (b: StoreBanner, activeId?: string): BannerStatus => {
  const now = Date.now();
  if (b._id === activeId) return { label: 'Vigente', color: 'success' };
  if (+new Date(b.startDate) > now) return { label: 'Programado', color: 'info' };
  if (+new Date(b.endDate) < now) return { label: 'Vencido', color: 'default' };
  return { label: 'Tapado por uno más nuevo', color: 'warning' };
};

export type BannerValues = {
  imageUrl: string;
  title: string;
  /** "YYYY-MM-DD" (día completo, hora del Este). */
  startDate: string;
  endDate: string;
};

/** Nuevo: hoy → hoy + 6 (una semana inclusive). Editando: los datos del banner. */
export const bannerDefaults = (b?: StoreBanner | null): BannerValues =>
  b
    ? {
        imageUrl: b.imageUrl,
        title: b.title || '',
        startDate: toDay(b.startDate),
        endDate: toDay(b.endDate),
      }
    : { imageUrl: '', title: '', startDate: today(), endDate: plusDays(6) };

export const validRange = (start?: string, end?: string) => !!start && !!end && end >= start;

// Marco 3:1 común a vigente, formulario e historial: todos los banners se ven con la misma forma.
export const bannerFrame = {
  p: 0,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  overflow: 'hidden',
  display: 'block',
  width: '100%',
  cursor: 'zoom-in',
  bgcolor: 'background.default',
  aspectRatio: '3 / 1',
  '& img': { display: 'block', width: '100%', height: '100%', objectFit: 'cover' },
} as const;

/** Sub-bloque con borde fino dentro de la tarjeta. */
export const blockSx = {
  p: 2,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  minWidth: 0,
} as const;
