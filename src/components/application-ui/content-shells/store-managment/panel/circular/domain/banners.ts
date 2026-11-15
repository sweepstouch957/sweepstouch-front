/** Estado de un banner de las listas. Puro. */
import type { StoreBanner } from '@/services/circular';

export type BannerStatus = {
  label: string;
  color: 'success' | 'info' | 'default' | 'warning';
};

export const bannerStatus = (
  b: Pick<StoreBanner, '_id' | 'startDate' | 'endDate'>,
  activeId?: string,
  now = Date.now()
): BannerStatus => {
  if (b._id === activeId) return { label: 'Vigente', color: 'success' };
  if (+new Date(b.startDate) > now) return { label: 'Programado', color: 'info' };
  if (+new Date(b.endDate) < now) return { label: 'Vencido', color: 'default' };
  return { label: 'Tapado por uno más nuevo', color: 'warning' };
};
