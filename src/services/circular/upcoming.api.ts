/** Próximos: precios pendientes por fecha, sólo-flyer e imports automáticos de campañas. */
import { api } from '@/libs/axios';
import type {
  CampaignImportJob,
  StoreBanner,
  StorePendingPrice,
  StoreProduct,
  UpcomingGroup,
} from './types';

export const upcomingApi = {
  /** Productos que todavía no salen (precio en `pending`), agrupados por día y origen. */
  async getUpcoming(storeSlug: string): Promise<{
    total: number;
    flyerOnly: boolean;
    groups: UpcomingGroup[];
    banners: (StoreBanner & { day: string })[];
  }> {
    const res = await api.get(`/circulars/store/${storeSlug}/upcoming`);
    return {
      total: res.data?.total ?? 0,
      flyerOnly: res.data?.flyerOnly === true,
      groups: res.data?.groups ?? [],
      banners: res.data?.banners ?? [],
    };
  },

  /** "Sólo flyer": on=true deja de cargar el circular semanal (y descarta lo que dejó
   *  esperando fecha) hasta que se apague. */
  async setFlyerOnly(
    storeSlug: string,
    on: boolean
  ): Promise<{
    flyerOnly: boolean;
    pendingRemoved?: number;
    pendingReverted?: number;
    hidden?: number;
  }> {
    const res = await api.patch(`/circulars/store/${storeSlug}/flyer-only`, { on });
    return res.data;
  },

  /** Corrige el precio que VA a salir (no el de hoy) o mueve su fecha. */
  async updatePending(
    id: string,
    patch: Partial<
      Pick<
        StorePendingPrice,
        'price' | 'originalPrice' | 'savings' | 'packQty' | 'packUnit' | 'from'
      >
    >
  ): Promise<StoreProduct> {
    const res = await api.patch(`/circulars/store-product/${id}/pending`, patch);
    return res.data.item;
  },

  /** Aprobar por adelantado (Revisar y publicar): sale solo en su fecha. */
  async approveReview(circularId: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/circular/${circularId}/approve-review`);
    return res.data;
  },

  /** Quitar la aprobación: ese día vuelve a quedar "Por revisar". */
  async unapproveReview(circularId: string): Promise<{ ok: boolean }> {
    const res = await api.delete(`/circulars/circular/${circularId}/approve-review`);
    return res.data;
  },

  /** Publica ya un producto que esperaba su fecha. */
  async publishPendingNow(id: string): Promise<{ applied: number }> {
    const res = await api.post(`/circulars/store-product/${id}/pending/apply`);
    return res.data;
  },

  /** Publica ya un grupo entero (un día y/o un circular). Con `day`, adelanta también el
   *  banner automático de ese día. */
  async publishUpcomingNow(
    storeSlug: string,
    scope: { day?: string; circularId?: string }
  ): Promise<{ applied: number; bannersMoved?: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/upcoming/apply`, scope);
    return res.data;
  },

  /** Que no salga: un alta se borra, un cambio de precio se descarta (queda el de hoy). */
  async cancelPending(id: string): Promise<{ removed: boolean }> {
    const res = await api.delete(`/circulars/store-product/${id}/pending`);
    return res.data;
  },

  /** Estado del import automático de productos de una campaña (se encola al agendarla). */
  async getCampaignImport(campaignId: string): Promise<CampaignImportJob | null> {
    const res = await api.get(`/circulars/campaign-import/campaign/${campaignId}`);
    return res.data?.job ?? null;
  },

  /** Reintenta el import automático (p. ej. tras un fallo). Idempotente en el servidor. */
  async retryCampaignImport(input: {
    campaignId: string;
    storeId: string;
    imageUrl: string;
    startDate: string | Date;
    title?: string;
  }): Promise<CampaignImportJob> {
    const res = await api.post('/circulars/campaign-import', { ...input, force: true });
    return res.data.job;
  },

  /** Importaciones de campañas de la semana (fallidas, en cola, corriendo, listas). */
  async getImportJobs(storeSlug: string): Promise<{ ok: boolean; jobs: CampaignImportJob[] }> {
    const res = await api.get(`/circulars/campaign-import/store/${storeSlug}/jobs`);
    return res.data;
  },

  /** Reintenta una importación fallida ahora mismo. */
  async retryImportJob(id: string): Promise<{ ok: boolean; job: CampaignImportJob }> {
    const res = await api.post(`/circulars/campaign-import/job/${id}/retry`, {});
    return res.data;
  },
};
