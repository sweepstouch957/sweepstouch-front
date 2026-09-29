import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

/** Experimento de audiencia: SIMULACIÓN. No agrega clientes, no envía ni cobra. */
export interface AudienceExperimentConfig {
  active: boolean;
  sourceStoreIds: string[];
  threshold: number;
  weeklyPerStore: number;
  startDate: string | null;
  updatedAt?: string;
  /** Tiendas fuente con su nombre y cuántos clientes activos tienen. */
  sources?: Array<{ storeId: string; name: string; pool: number }>;
}

export interface AudienceExperimentTarget {
  storeId: string;
  name: string;
  audience: number;
  added: number;
  simulatedAudience: number;
  growthPct: number | null;
  reachedCap: boolean;
  campaignsSince: number;
  campaignsPerWeek: number;
  rate: number;
  revenueToDate: number;
  weeklyRevenueNow: number;
}

export interface AudienceExperimentResult {
  weeks: number;
  summary: {
    targets: number;
    added: number;
    revenueToDate: number;
    weeklyRevenueNow: number;
    atCap: number;
    sourcePool: number;
  };
  targets: AudienceExperimentTarget[];
  sources: Array<{ storeId: string; name: string; pool: number; provided: number }>;
  timeline: Array<{ week: number; added: number }>;
}

export interface AudienceExperimentResponse {
  ok: boolean;
  config: AudienceExperimentConfig;
  /** null mientras el experimento esté apagado o le falten fuentes / fecha. */
  result: AudienceExperimentResult | null;
}

export type SaveAudienceExperimentDto = Omit<AudienceExperimentConfig, 'sources' | 'updatedAt'>;

/* ══════════ API ══════════ */
const BASE = '/campaigns/audience-experiment';

export const audienceExperimentService = {
  get: async (): Promise<AudienceExperimentResponse> => {
    const { data } = await api.get(BASE);
    return data;
  },
  save: async (dto: SaveAudienceExperimentDto): Promise<AudienceExperimentConfig> => {
    const { data } = await api.put(BASE, dto);
    return data.config;
  },
};
