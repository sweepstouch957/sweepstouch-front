/** Agentes IA: perfil/reglas/lecciones de la tienda, bitácora, auditoría y revisión diaria. */
import { api } from '@/libs/axios';
import type {
  AuditVerification,
  PageAudit,
  Pipeline,
  ProductReviewState,
  StoreProfile,
} from './types';

export const agentsApi = {
  /* ── Perfil de la tienda: reglas fijas para la IA + departamentos aprendidos ── */
  async getStoreProfile(storeSlug: string): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.get(`/circulars/store/${storeSlug}/profile`);
    return res.data;
  },

  async saveStoreRules(
    storeSlug: string,
    rules: string
  ): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.put(`/circulars/store/${storeSlug}/profile`, { rules });
    return res.data;
  },

  async addStoreLesson(
    storeSlug: string,
    text: string,
    agent?: string
  ): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.post(`/circulars/store/${storeSlug}/profile/lessons`, {
      text,
      ...(agent ? { agent } : {}),
    });
    return res.data;
  },

  async removeStoreLesson(
    storeSlug: string,
    index: number
  ): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.delete(`/circulars/store/${storeSlug}/profile/lessons/${index}`);
    return res.data;
  },

  /* ── Bitácora de los agentes del circular ── */
  async getPipeline(circularId: string): Promise<Pipeline> {
    const res = await api.get(`/circulars/${circularId}/pipeline`);
    return res.data;
  },

  /* ── Auditoría por página (agentes de revisión) ── */
  async getAudit(circularId: string): Promise<{
    ok: boolean;
    running: boolean;
    accuracy: number | null;
    pages: PageAudit[];
    verification: AuditVerification | null;
  }> {
    const res = await api.get(`/circulars/${circularId}/audit`);
    return res.data;
  },

  async runAudit(circularId: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/${circularId}/audit`, {});
    return res.data;
  },

  /* ── Revisión IA de productos (circular-service /review) ── */
  async getProductReview(storeSlug: string): Promise<ProductReviewState> {
    const res = await api.get(`/circulars/review/store/${storeSlug}`);
    return res.data;
  },

  async runProductReview(storeSlug: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/store/${storeSlug}/run`, {});
    return res.data;
  },

  async applySafeReviews(storeSlug: string): Promise<{ ok: boolean; applied: number }> {
    const res = await api.post(`/circulars/review/store/${storeSlug}/apply-safe`, {});
    return res.data;
  },

  async applyReview(id: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/${id}/apply`, {});
    return res.data;
  },

  async ignoreReview(id: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/${id}/ignore`, {});
    return res.data;
  },
};
