// services/earningsTiers.service.ts
// Frontend API client for admin earnings tier configuration.
import { api } from '@/libs/axios';

/* ── Types ─────────────────────────────────────────────────── */

export interface EarningsTier {
  maxCount: number;
  ratePerNew: number;
  label: string;
}

export interface EarningsTierConfig {
  _id: string;
  name: string;
  active: boolean;
  tiers: EarningsTier[];
  flatRateNew: number;
  flatRateExisting: number;
  requireSmsValidation: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEarningsTiersPayload {
  name?: string;
  tiers?: EarningsTier[];
  flatRateNew?: number;
  flatRateExisting?: number;
  requireSmsValidation?: boolean;
  updatedBy?: string;
}

/* ── Service ───────────────────────────────────────────────── */

class EarningsTiersService {
  /** Get the current active configuration */
  async getConfig(): Promise<EarningsTierConfig> {
    const res = await api.get('/sweepstakes/admin/earnings-tiers');
    return res.data.config;
  }

  /** Update or create the active configuration */
  async updateConfig(data: UpdateEarningsTiersPayload): Promise<EarningsTierConfig> {
    const res = await api.put('/sweepstakes/admin/earnings-tiers', data);
    return res.data.config;
  }

  /** Get historical configurations */
  async getHistory(): Promise<EarningsTierConfig[]> {
    const res = await api.get('/sweepstakes/admin/earnings-tiers/history');
    return res.data.configs;
  }
}

export const earningsTiersService = new EarningsTiersService();
