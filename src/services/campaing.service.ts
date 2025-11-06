import { api } from '@/libs/axios';
import type { Campaing } from '@/models/campaing';
import type { PaginatedResponse } from '@/models/pagination';

interface FilterCampaignParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  title?: string;
}

export type MessageLogStatus =
  | 'queued'
  | 'failed'
  | 'sent'
  | 'delivered' //
  | 'undelivered';

export interface CampaignLog {
  messageSid?: string;
  phone?: string;
  destinationTn?: string;
  sourceTn?: string;
  status: MessageLogStatus;
  bwMessageStatus?: string;
  messageType?: string;
  segmentCount?: number;
  messageLength?: number;
  messageSize?: number;
  attachmentCount?: number;
  recipientCount?: number;
  carrierName?: string;
  carrier?: string;
  campaignClass?: string;
  price?: number;
  errorInfo?: {
    code: string;
    class: string;
    key: string;
    explanation: string;
    friendly: string;
    source: string;
    billable?: boolean;
  } | null;
  dateSent?: string;
  timestamp?: string;
  body?: string;
  errorCode?: string;
  errorMessage?: string;
  phoneNumber?: string;
  createdAt?: string;
  time?: string;
  sid?: string;
}

export interface CampaignLogsResponse {
  campaignId: string;
  filters: {
    status: MessageLogStatus | 'any';
    search: string | null;
    from: string | null;
    to: string | null;
  };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: 'asc' | 'desc';
  countsByStatus: Record<MessageLogStatus, number>;
  data: CampaignLog[];
}

export interface CampaignLogsQueryParams {
  status?: MessageLogStatus;
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  search?: string;
  from?: string;
  to?: string;
}

/* ===================== NUEVOS TIPOS PARA YTD ===================== */
export interface YtdMonthlyMonth {
  monthNumber: number; // 1..12
  monthName: string; // "Jan".."Dec"
  sentSms: number;
  sentMms: number;
  sent: number; // sentSms + sentMms
}

export interface YtdMonthlyResponse {
  storeId: string | null; // null => todas las tiendas
  scope: 'by_store' | 'all_stores'; // para que sepas qué devolvió
  year: number;
  totalYtd: number;
  totalYtdSms: number;
  totalYtdMms: number;
  months: YtdMonthlyMonth[];
}

/* ========================= CLIENTE ========================= */
class CampaignClient {
  async getCampaigns(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Campaing>> {
    const res = await api.get(`/campaigns/filter`, {
      params: { page, limit },
    });
    return res.data;
  }

  async getCampaignsCount(month?: number, year?: number): Promise<number> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1; // 1..12
    const y = year ?? now.getFullYear();

    const res = await api.get('/campaigns/total-sent-by-month', {
      params: { month: m, year: y },
    });
    return res.data.totalSent ?? 0;
  }

  async getFilteredCampaigns({
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    storeId,
    title,
  }: FilterCampaignParams) {
    const res = await api.get('/campaigns/filter', {
      params: { page, limit, status, startDate, endDate, storeId, title },
    });
    return res.data;
  }

  async getCampaignById(id: string): Promise<Campaing> {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  }

  async createCampaign(data: Partial<Campaing>, storeId: string): Promise<Campaing> {
    const payload = {
      ...data,
      store: storeId,
    };

    const res = await api.post(`/campaigns`, payload);
    return res.data;
  }

  async updateCampaign(id: string, data: Campaing): Promise<Campaing> {
    const res = await api.put(`/campaigns/old/${id}`, data);
    return res.data;
  }

  async deleteCampaign(id: string): Promise<Campaing> {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data;
  }

  async getCampaignLogs(
    campaignId: string,
    params: CampaignLogsQueryParams = {}
  ): Promise<CampaignLogsResponse> {
    const { status, page = 1, limit = 20, sort = 'desc', search, from, to } = params;

    const res = await api.get(`/tracking/campaigns/${campaignId}/logs`, {
      params: {
        status,
        page,
        limit,
        sort,
        search,
        from,
        to,
      },
    });

    return res.data;
  }

  /* ===================== NUEVO MÉTODO: YTD MONTHLY ===================== */
  /**
   * Obtiene los mensajes enviados YTD (mes a mes) separados en SMS/MMS.
   * - Si envías storeId => filtra por tienda.
   * - Si NO envías storeId => devuelve métricas globales (todas las tiendas).
   *
   * @param storeId   opcional
   * @param year      opcional (por defecto: año actual)
   */
  async getYtdMonthlyMessagesSent(storeId?: string, year?: number): Promise<YtdMonthlyResponse> {
    const path = storeId
      ? `/campaigns/messages/sent/ytd-monthly/${storeId}`
      : `/campaigns/messages/sent/ytd-monthly`;

    const params: Record<string, any> = {};
    if (typeof year === 'number') params.year = year;

    const res = await api.get(path, { params });
    return res.data as YtdMonthlyResponse;
  }
}

export const campaignClient = new CampaignClient();
