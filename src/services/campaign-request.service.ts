import { api } from '@/libs/axios';

export type CampaignRequestStatus =
  | 'collecting'
  | 'pending_design'
  | 'in_review'
  | 'change_requested'
  | 'approved'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface CampaignProduct {
  name: string;
  price?: number;
  originalPrice?: number;
  discount?: string;
  description?: string;
  unit?: string;
  imageUrl?: string;
}

export interface CampaignProposal {
  _id: string;
  imageUrl: string;
  publicId?: string;
  sentAt: string;
  sentBy?: string;
  sentByName?: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  isAIGenerated: boolean;
}

export interface ChangeRequest {
  requestedAt: string;
  description: string;
  resolvedAt?: string;
}

export interface CampaignRequest {
  _id: string;
  store: string;
  storeSlug?: string;
  storeName?: string;
  storePhone?: string;
  status: CampaignRequestStatus;
  title?: string;
  promotionText?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  products: CampaignProduct[];
  specialNotes?: string;
  proposals: CampaignProposal[];
  approvedProposalIndex?: number;
  approvedImageUrl?: string;
  changeRequests: ChangeRequest[];
  campaignRef?: string;
  assignedDesigner?: string;
  assignedDesignerName?: string;
  lastCampaignContext?: unknown;
  previewsSent: { type: string; sentAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRequestStats {
  total: number;
  collecting?: number;
  pending_design?: number;
  in_review?: number;
  change_requested?: number;
  approved?: number;
  scheduled?: number;
  active?: number;
  completed?: number;
  cancelled?: number;
}

export interface ListRequestsParams {
  store?: string;
  status?: CampaignRequestStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AIBriefResponse {
  brief: {
    headline: string;
    subheadline: string;
    colorScheme: string[];
    layout: string;
    emphasis: string;
    callToAction: string;
    designNotes: string;
  };
  products: CampaignProduct[];
}

export interface RepositoryProduct {
  id_product?: number;
  desc_full_product: string;
  brand?: string;
  url_image?: string;
  has_image?: boolean;
  regular_price?: number;
  sale_price?: number;
  search_text?: string;
}

const BASE = '/campaign-requests';
const PRODUCTS_BASE = '/products'; // proxied to campaign-request-service /products

export const campaignRequestService = {
  async list(params: ListRequestsParams = {}) {
    const res = await api.get<{ data: CampaignRequest[]; total: number; page: number; limit: number }>(BASE, { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<CampaignRequest>(`${BASE}/${id}`);
    return res.data;
  },

  async update(id: string, body: Partial<CampaignRequest>) {
    const res = await api.patch<{ ok: boolean; data: CampaignRequest }>(`${BASE}/${id}`, body);
    return res.data;
  },

  async uploadProposal(id: string, payload: { imageUrl: string; publicId?: string; isAIGenerated?: boolean }) {
    const res = await api.post<{ ok: boolean; proposalIdx: number; data: CampaignRequest }>(`${BASE}/${id}/proposals`, payload);
    return res.data;
  },

  async getAIBrief(id: string) {
    const res = await api.get<AIBriefResponse>(`${BASE}/${id}/ai-brief`);
    return res.data;
  },

  async getStats() {
    const res = await api.get<CampaignRequestStats>(`${BASE}/stats`);
    return res.data;
  },

  /** Search from the global product repository (Supabase) */
  async searchProducts(params: { q?: string; brand?: string; page?: number; limit?: number }) {
    const res = await api.get<{ data: RepositoryProduct[]; pagination: any }>(PRODUCTS_BASE, { params: { ...params, hasImage: true } });
    return res.data;
  },

  /** Get brands from repository */
  async getBrands(letter = 'A') {
    const res = await api.get<any[]>(`${PRODUCTS_BASE}/brands`, { params: { letter } });
    return res.data;
  },
};

export const STATUS_LABELS: Record<CampaignRequestStatus, string> = {
  collecting: 'Recopilando',
  pending_design: 'Pendiente diseño',
  in_review: 'En revisión',
  change_requested: 'Cambios solicitados',
  approved: 'Aprobado',
  scheduled: 'Programado',
  active: 'Activo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const STATUS_COLORS: Record<CampaignRequestStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  collecting: 'default',
  pending_design: 'warning',
  in_review: 'info',
  change_requested: 'error',
  approved: 'success',
  scheduled: 'primary',
  active: 'success',
  completed: 'default',
  cancelled: 'error',
};

