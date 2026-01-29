// src/services/campaing.service.ts
import { api } from '@/libs/axios';
import type { Campaing } from '@/models/campaing';
import type { PaginatedResponse } from '@/models/pagination';

/* ========================= CAMPAIGNS (RESTORE) ========================= */

export interface FilterCampaignParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  title?: string;
  storeName?: string;
  type?: string;
}

export type MessageLogStatus = 'queued' | 'failed' | 'sent' | 'delivered' | 'undelivered';

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

/* ===================== YTD (existing) ===================== */
export interface YtdMonthlyMonth {
  monthNumber: number;
  monthName: string;
  sentSms: number;
  sentMms: number;
  sent: number;
  audienceSms: number;
  audienceMms: number;
  audience: number;
}

export interface YtdMonthlyResponse {
  storeId: string | null;
  scope: 'by_store' | 'all_stores';
  year: number;
  totalYtd: number;
  totalYtdSms: number;
  totalYtdMms: number;
  months: YtdMonthlyMonth[];
}

/* ===================== ✅ AUDIENCE (MATCH BACKEND) ===================== */

export type AudiencePeriod = '7d' | '14d' | '30d' | '90d' | 'ytd' | 'custom';

export interface AudienceQueryParams {
  period?: AudiencePeriod;
  year?: number;
  start?: string; // YYYY-MM-DD or ISO
  end?: string; // YYYY-MM-DD or ISO
  timezone?: string;
  includeInactive?: boolean;
}

/** ✅ /simulator -> por store */
export interface AudienceSimulatorQueryParams extends AudienceQueryParams {
  storeId: string;
  assumedCampaignsPerMonth?: number;
  assumedLiftPct?: number;
  assumedChurnReductionPct?: number;
}

export interface AudienceSimulatorResponse {
  storeId: string;
  storeName?: string;
  slug?: string;

  baseline: {
    currentAudience: number;
    previousAudience: number;
    netGrowth: number;
    growthPct: number;
    churn: number;
    new: number;
  };

  scenario: {
    assumedCampaignsPerMonth: number;
    assumedLiftPct: number;
    assumedChurnReductionPct: number;

    projected: {
      currentAudience: number;
      netGrowth: number;
      growthPct: number;
      churn: number;
      new: number;
    };

    delta: {
      audience: number;
      netGrowth: number;
      churn: number;
      new: number;
    };
  };
}

/** ✅ Backend summary group shape */
export interface AudienceSummaryGroup {
  storesCount: number;
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number; // already in %
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
}

/** ✅ GET /campaigns/audience/summary */
export interface AudienceSummaryResponse {
  ok: boolean;
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;

  sendersSummary: AudienceSummaryGroup;
  nonSendersSummary: AudienceSummaryGroup;

  compare: {
    sendersAudience: number;
    nonSendersAudience: number;
    sendersStores: number;
    nonSendersStores: number;
  };
}

/** ✅ GET /campaigns/audience/store/:storeId */
export interface AudienceStoreDetailResponse {
  ok: boolean;
  storeId: string;
  store: { _id: string; name: string; slug?: string } | null;

  period: { start: string; end: string };
  prevPeriod: { start: string; end: string };

  audienceCurr: number;
  audiencePrev: number;
  growthAbs: number;
  growthPct: number;

  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;

  isSenderInPeriod: boolean;
}

/** ✅ GET /campaigns/audience/weekly */
export interface WeeklyBreakdownQueryParams extends AudienceQueryParams {
  weeks?: number;
}

export interface WeeklyGroupPoint {
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
}

export interface WeeklyBreakdownPoint {
  label: string; // e.g. "W-7"
  start: string;
  end: string;
  senders: WeeklyGroupPoint;
  nonSenders: WeeklyGroupPoint;
}

export interface WeeklyBreakdownResponse {
  ok: boolean;
  weeks: number;
  period: { start: string; end: string };
  data: WeeklyBreakdownPoint[];
}

/** ✅ GET /campaigns/audience/series */
export interface AudienceMonthlySeriesQueryParams extends AudienceQueryParams {
  year?: number;
}

export interface MonthlySeriesGroupPoint {
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
}

export interface AudienceMonthlySeriesPoint {
  month: number; // 1..12
  label: string; // "Jan"
  senders: MonthlySeriesGroupPoint;
  nonSenders: MonthlySeriesGroupPoint;
}

export interface AudienceMonthlySeriesResponse {
  ok: boolean;
  year: number;
  data: AudienceMonthlySeriesPoint[];
}

/** ✅ GET /campaigns/audience/alerts */
export interface AudienceAlertsQueryParams extends AudienceQueryParams {
  limit?: number;
  alertGrowthPct?: number;
  minAudience?: number;
  onlyNonSenders?: boolean;
}

export interface AudienceAlertRow {
  storeId: string;
  name: string;
  slug?: string;
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
}

export interface AudienceAlertsResponse {
  ok: boolean;
  alertGrowthPct: number;
  minAudience: number;
  total: number;
  data: AudienceAlertRow[];
}

/** ✅ GET /campaigns/audience/simulate (GLOBAL) */
export interface AudienceSimulationResponse {
  ok: boolean;

  period: { start: string; end: string };
  prevPeriod: { start: string; end: string };

  base: {
    senders: AudienceSummaryGroup;
    nonSenders: AudienceSummaryGroup;
  };

  simulation: {
    adoptionRate: number;
    averageLift: number;
    averageChurnReduction: number;

    projectedNonSenders: {
      audienceCurr: number;
      growthAbs: number;
      netGrowth: number;
      churnInPeriod: number;
      newInPeriod: number;
    };

    totalProjectedAudienceCurr: number;
    deltaTotalAudience: number;
  };
}

/* ========================= CLIENTE ========================= */

const AUDIENCE_BASE = '/campaigns/audience';

class CampaignClient {
  /* ===================== ✅ CAMPAIGNS (RESTORED) ===================== */

  async getCampaigns(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Campaing>> {
    const res = await api.get(`/campaigns/filter`, { params: { page, limit } });
    return res.data as PaginatedResponse<Campaing>;
  }

 async getFilteredCampaigns(params: FilterCampaignParams) {
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    storeId,
    title,
    storeName, // ✅
    type,      // ✅
  } = params;

  const res = await api.get('/campaigns/filter', {
    params: { page, limit, status, startDate, endDate, storeId, title, storeName, type },
  });

  return res.data;
}


  async getCampaignById(id: string): Promise<Campaing> {
    const res = await api.get(`/campaigns/${id}`);
    return res.data as Campaing;
  }

  async createCampaign(data: Partial<Campaing>, storeId: string): Promise<Campaing> {
    const payload = { ...data, store: storeId };
    const res = await api.post(`/campaigns`, payload);
    return res.data as Campaing;
  }

  // OJO: tu backend tiene /campaigns/old/:id en tu snippet anterior
  async updateCampaign(id: string, data: Campaing): Promise<Campaing> {
    const res = await api.put(`/campaigns/old/${id}`, data);
    return res.data as Campaing;
  }

  async deleteCampaign(id: string): Promise<Campaing> {
    const res = await api.delete(`/campaigns/${id}`);
    return res.data as Campaing;
  }

  async getCampaignLogs(
    campaignId: string,
    params: CampaignLogsQueryParams = {}
  ): Promise<CampaignLogsResponse> {
    const { status, page = 1, limit = 20, sort = 'desc', search, from, to } = params;

    const res = await api.get(`/tracking/campaigns/${campaignId}/logs`, {
      params: { status, page, limit, sort, search, from, to },
    });

    return res.data as CampaignLogsResponse;
  }

  async getCampaignsCount(month?: number, year?: number): Promise<number> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const res = await api.get('/campaigns/total-sent-by-month', { params: { month: m, year: y } });
    return res.data?.totalSent ?? 0;
  }

  async getYtdMonthlyMessagesSent(storeId?: string, year?: number): Promise<YtdMonthlyResponse> {
    const path = storeId
      ? `/campaigns/messages/sent/ytd-monthly/${storeId}`
      : `/campaigns/messages/sent/ytd-monthly`;

    const params: Record<string, any> = {};
    if (typeof year === 'number') params.year = year;

    const res = await api.get(path, { params });
    return res.data as YtdMonthlyResponse;
  }

  /* ===================== ✅ AUDIENCE (CURRENT) ===================== */

  async getAudienceSummary(params: AudienceQueryParams = {}): Promise<AudienceSummaryResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/summary`, { params });
    return res.data as AudienceSummaryResponse;
  }

  async getAudienceStoreDetail(
    storeId: string,
    params: AudienceQueryParams = {}
  ): Promise<AudienceStoreDetailResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/store/${storeId}`, { params });
    return res.data as AudienceStoreDetailResponse;
  }

  async getAudienceWeeklyBreakdown(
    params: WeeklyBreakdownQueryParams = {}
  ): Promise<WeeklyBreakdownResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/weekly`, { params });
    return res.data as WeeklyBreakdownResponse;
  }

  async getAudienceMonthlySeries(
    params: AudienceMonthlySeriesQueryParams = {}
  ): Promise<AudienceMonthlySeriesResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/series`, { params });
    return res.data as AudienceMonthlySeriesResponse;
  }

  async getAudienceAlerts(params: AudienceAlertsQueryParams = {}): Promise<AudienceAlertsResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/alerts`, { params });
    return res.data as AudienceAlertsResponse;
  }

  async getAudienceSimulation(
    params: AudienceQueryParams = {}
  ): Promise<AudienceSimulationResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/simulate`, { params });
    return res.data as AudienceSimulationResponse;
  }

  // ✅ adicional: simulador por store (si tu backend lo expone)
  async getAudienceSimulator(
    params: AudienceSimulatorQueryParams
  ): Promise<AudienceSimulatorResponse> {
    const res = await api.get(`${AUDIENCE_BASE}/simulator`, { params });
    return res.data as AudienceSimulatorResponse;
  }
}

export const campaignClient = new CampaignClient();

/* ========================= ✅ REACT QUERY KEYS ========================= */

export const campaignAudienceKeys = {
  all: ['campaigns', 'audience'] as const,

  summary: (params: AudienceQueryParams) =>
    [...campaignAudienceKeys.all, 'summary', params] as const,

  store: (storeId: string, params: AudienceQueryParams) =>
    [...campaignAudienceKeys.all, 'store', storeId, params] as const,

  weekly: (params: WeeklyBreakdownQueryParams) =>
    [...campaignAudienceKeys.all, 'weekly', params] as const,

  series: (params: AudienceMonthlySeriesQueryParams) =>
    [...campaignAudienceKeys.all, 'series', params] as const,

  alerts: (params: AudienceAlertsQueryParams) =>
    [...campaignAudienceKeys.all, 'alerts', params] as const,

  simulate: (params: AudienceQueryParams) =>
    [...campaignAudienceKeys.all, 'simulate', params] as const,

  simulator: (params: AudienceSimulatorQueryParams) =>
    [...campaignAudienceKeys.all, 'simulator', params] as const,
};

/* ========================= (OPTIONAL) tiny helpers ========================= */
/**
 * Si en tu app hay hooks tipo useAudienceSummary/useAudienceWeekly/etc,
 * normalmente están en /hooks y llaman a campaignClient + campaignAudienceKeys.
 * Aquí solo restauramos el service completo sin romper imports existentes.
 */
