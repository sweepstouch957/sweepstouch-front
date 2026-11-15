/** Banners de la tienda. */
import { api } from '@/libs/axios';
import type { StoreBanner } from './types';

export const bannersApi = {
  /** Banners de campaña del Pre-RCS: el vigente (o null) + histórico, más nuevo primero. */
  async getStoreBanners(
    storeSlug: string
  ): Promise<{ active: StoreBanner | null; items: StoreBanner[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/banners`);
    return res.data;
  },

  /** Fechas como "YYYY-MM-DD" (día completo, hora del Este). */
  async saveStoreBanner(
    storeSlug: string,
    body: { imageUrl: string; title?: string; startDate: string; endDate: string },
    id?: string
  ): Promise<{ ok: boolean; item: StoreBanner }> {
    const res = id
      ? await api.patch(`/circulars/store-banner/${id}`, body)
      : await api.post(`/circulars/store/${storeSlug}/banners`, body);
    return res.data;
  },

  /** La IA recorta el header del flyer y lo deja como banner con la vigencia del circular.
   *  `sourceUrl` = arte de campaña; sin él usa el archivo del circular vigente. ~20 s. */
  async bannerFromFlyer(
    storeSlug: string,
    sourceUrl?: string
  ): Promise<{ ok: boolean; item: StoreBanner }> {
    const res = await api.post(
      `/circulars/store/${storeSlug}/banners/from-flyer`,
      sourceUrl ? { sourceUrl } : {},
      { timeout: 120_000 }
    );
    return res.data;
  },

  async deleteStoreBanner(id: string): Promise<{ ok: boolean }> {
    const res = await api.delete(`/circulars/store-banner/${id}`);
    return res.data;
  },
};
