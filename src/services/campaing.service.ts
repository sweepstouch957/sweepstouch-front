// src/services/campaing.service.ts
import { api } from '@/libs/axios';

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
/** ✅ /simulate -> simulador */
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
  onlyNonSenders?: boolean; // backend currently supports this logic
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

/** ✅ GET /campaigns/audience/simulate (GLOBAL in your backend) */
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

/* ========================= CLIENTE (AUDIENCE) ========================= */

const AUDIENCE_BASE = '/campaigns/audience';

class CampaignClient {
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
};
