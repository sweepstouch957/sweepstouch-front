import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

/**
 * Relleno de audiencia: lo que una tienda pierde por depuración en el mes se repone
 * (+extra %) con clientes de tiendas fuente, repartido día a día. Esos clientes quedan
 * marcados como INDIRECTOS de la tienda (Customer.indirectStores).
 */
export interface AudienceExperimentConfig {
  active: boolean;
  sourceStoreIds: string[];
  threshold: number;
  extraPct: number;
  startDate: string | null;
  lastRunDay: string | null;
  updatedAt?: string;
  sources?: Array<{ storeId: string; name: string; pool: number; provided: number }>;
}

export interface AudienceRefillRow {
  storeId: string;
  name: string;
  audience: number;
  /** Clientes que quedaron inactivos este mes. */
  purged: number;
  /** purged × (1 + extra%). */
  quota: number;
  /** Ya repuestos este mes. */
  added: number;
  remaining: number;
  /** Lo que toca agregar hoy. */
  today: number;
  addedToday: number;
}

export interface AudienceRefillResult {
  period: string;
  day: string;
  since: string;
  applied: boolean;
  stores: AudienceRefillRow[];
  sources: Array<{ storeId: string; name: string; pool: number; provided: number }>;
}

export interface AudienceExperimentResponse {
  ok: boolean;
  config: AudienceExperimentConfig;
  result: AudienceRefillResult | null;
}

export type SaveAudienceExperimentDto = Pick<
  AudienceExperimentConfig,
  'active' | 'sourceStoreIds' | 'threshold' | 'extraPct' | 'startDate'
>;

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
  /** Aplica el plan de hoy ahora (escribe clientes). Una vez por día. */
  run: async (): Promise<AudienceRefillResult> => {
    const { data } = await api.post(`${BASE}/run`);
    return data.result;
  },
  /** Saca de la tienda a los clientes indirectos agregados (todo o un período "YYYY-MM"). */
  undo: async (storeId: string, period?: string): Promise<number> => {
    const { data } = await api.post(`${BASE}/undo`, { storeId, period });
    return data.undone;
  },
};
