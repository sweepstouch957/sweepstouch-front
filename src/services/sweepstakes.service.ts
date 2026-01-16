// services/sweeptakeService.ts
import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';

/* ===================== PARTICIPANTS ===================== */

export interface RegisterParticipantPayload {
  sweepstakeId: string;
  customerPhone: string;
  storeId: string;
  createdBy?: string;
  method?: 'qr' | 'tablet' | 'pinpad' | 'web' | 'referral' | 'promotor';
}

export interface FilterParams {
  promotorId?: string;
  startDate: string;
  endDate: string;
  storeId?: string;
  method?: 'qr' | 'tablet' | 'pinpad' | 'web' | 'referral' | 'promotor';
  sweepstakeId?: string;
}

export interface FilterPromotors {
  startDate: string;
  endDate: string;
  storeIds?: string[];
}

export interface Pagination {
  page: number;
  limit: number;
}

/* ===================== CHECKLIST TYPES ===================== */

export type ChecklistStepKey =
  | 'clientBrief'
  | 'designAssets'
  | 'optinMedia'
  | 'storeInfra'
  | 'physicalMaterials'
  | 'campaignSend'
  | 'monitoring';

export interface ChecklistStep {
  done?: boolean;
  doneAt?: string;
  doneBy?: string;
  owner?: string;
  etaHours?: number;
  notes?: string;
  confirmationLink?: string;
}

export interface Checklist {
  clientBrief?: ChecklistStep;
  designAssets?: ChecklistStep;
  optinMedia?: ChecklistStep;
  storeInfra?: ChecklistStep;
  physicalMaterials?: ChecklistStep;
  campaignSend?: ChecklistStep;
  monitoring?: ChecklistStep;
}

/* ===================== STORES BY SWEEPSTAKE TYPES ===================== */

export interface StoreSweepstake {
  storeId: string;
  storeName: string;
  storeType?: 'elite' | 'basic' | 'free';
  storeImage: string;
  storeCustomerCount: number;
  totalParticipations: number;
}

export interface StoreSweepstakeResponse {
  total: number;
  page: number;
  limit: number;
  data: StoreSweepstake[];
}

/* ===================== SWEEPSTAKES TYPES ===================== */

export interface Sweepstakes {
  id: string;
  _id?: string;
  name: string;
  participants: number;
  stores: number;
  startDate: string;
  endDate: string;
  status: string;
  image: string;
  description?: string;
  winnersCount?: number;
  hasQr?: boolean;
  participationMessage?: string;
  rules?: string;
  checklist?: Checklist;
  checklistProgress?: number;
  prize?: Prize[] | string[];
  hasOptinLink?: boolean;
  confirmationLink?: string | null;
  createdAt?: string;
}

/** ===== Audience Windows ===== */
export interface AudienceWindowResponse {
  storeId: string;
  dateRange: { startDate: string; endDate: string };
  audience: { initial: number; final: number; delta: number; newInRange: number };
  byWeekday: Array<{ label: string; total: number }>;
  byDay: Array<{ date: string; total: number }>;
}

/** ===== Sample phones =====
 * Ajusta campos según tu endpoint real si devuelve más data.
 */
export interface ParticipantPhoneSample {
  phone: string;
  createdAt?: string;
  storeId?: string;
}

/** ===== Count by sweepstake ===== */
export interface SweepstakeRegistrationsCountResponse {
  sweepstakeId: string;
  totalRegistrations: number;
}

/* ===================== SWEEPSTAKES CLIENT ===================== */

export class SweepstakesClient {
  /* ------------ Participants ------------ */
  async registerParticipant(data: RegisterParticipantPayload): Promise<AxiosResponse> {
    return api.post('/sweepstakes/participants/register', data);
  }

  async getParticipants(sweepstakeId: string, storeId?: string): Promise<any[]> {
    const res = await api.get(`/sweepstakes/${sweepstakeId}/participants`, {
      params: storeId ? { storeId } : {},
    });
    return res.data;
  }

  async getSweepstakesParticipantCount(): Promise<number> {
    const res = await api.get(`/sweepstakes/participants/count`);
    return res.data.total;
  }

  async getParticipantsByPromotor(filters: FilterParams): Promise<any> {
    const res = await api.get('/sweepstakes/participants/by-promotor', { params: filters });
    return res.data;
  }

  async getRegistrationsByStore(filters: FilterParams): Promise<any> {
    const res = await api.get('/sweepstakes/participants/metrics', { params: filters });
    return res.data;
  }

  /* --------------- Stores --------------- */
  async getStoresBySweepstkes(id: string): Promise<any[]> {
    const res = await api.get(`/sweepstakes/${id}/stores`);
    return res.data;
  }

  async getStoresBySweepstkesFiltered(
    id: string,
    filters?: Pagination
  ): Promise<StoreSweepstakeResponse> {
    const res = await api.get(`/sweepstakes/${id}/stores`, { params: filters });
    return res.data;
  }

  /* ------------- Promotors -------------- */
  async getSweepstakesPromotors(filters: FilterPromotors): Promise<any> {
    const res = await api.get('/sweepstakes/participants/audit', { params: filters });
    return res.data;
  }

  async getMonthlyParticipants(year: number = 2026): Promise<any> {
    const res = await api.get('/sweepstakes/participants/reports', {
      params: { year },
    });
    return res.data;
  }

  /* ------------- Sweepstakes ------------- */
  async getSweepstakes(filters?: { status?: string; name?: string }): Promise<Sweepstakes[]> {
    const res = await api.get('/sweepstakes', { params: filters });
    return res.data;
  }

  async getSweepstakeById(id: string): Promise<Sweepstakes> {
    const res = await api.get(`/sweepstakes/${id}`);
    return res.data;
  }

  async getSweepstakeByStoreId(storeId: string, showParticipants = false): Promise<Sweepstakes> {
    const res = await api.get(`/sweepstakes/active/${storeId}`, {
      params: showParticipants ? { showParticipants: true } : {},
    });
    return res.data;
  }

  async createSweepstake(data: any): Promise<Sweepstakes> {
    const res = await api.post('/sweepstakes', data);
    return res.data;
  }

  async reasignSweepstake(
    originalSweepstakeId: string,
    storeId: string,
    newSweepstakeId: string
  ): Promise<Sweepstakes> {
    const res = await api.post(`/sweepstakes/reassign-store`, {
      originalSweepstakeId,
      storeId,
      newSweepstakeId,
    });
    return res.data;
  }

  /* -------- Checklist & Count ----- */
  async patchChecklistStep(
    sweepstakeId: string,
    step: ChecklistStepKey,
    body: Partial<ChecklistStep>
  ): Promise<{
    success: boolean;
    checklist: Checklist;
    checklistProgress: number;
    confirmationLink: string | null;
  }> {
    const res = await api.patch(`/sweepstakes/${sweepstakeId}/checklist/${step}`, body);
    return res.data;
  }

  async getChecklistProgress(sweepstakeId: string): Promise<{
    totalSteps: number;
    completed: number;
    progressPercent: number;
    checklist: Checklist;
  }> {
    const res = await api.get(`/sweepstakes/${sweepstakeId}/checklist/progress`);
    return res.data;
  }

  async getSweepstakeCount(): Promise<number> {
    const res = await api.get('/sweepstakes/count');
    return res.data.total ?? 0;
  }

  /* ====== Audience Windows por tienda ======
     GET /sweepstakes/participants/audience-windows/:storeId?startDate=ISO&endDate=ISO
  */
  async getAudienceWindows(
    storeId: string,
    startISO: string,
    endISO: string
  ): Promise<AudienceWindowResponse> {
    const res = await api.get(`/sweepstakes/participants/audience-windows/${storeId}`, {
      params: { startDate: startISO, endDate: endISO },
    });
    return res.data as AudienceWindowResponse;
  }

  /* ====== NUEVO: Sample phones ======
     GET /sweepstakes/participants/:sweepstakeId/participants/sample-phones?storeId=...
  */
  async getParticipantsSamplePhones(
    sweepstakeId: string,
    storeId?: string
  ): Promise<ParticipantPhoneSample[]> {
    const res = await api.get<ParticipantPhoneSample[]>(
      `/sweepstakes/participants/${sweepstakeId}/participants/sample-phones`,
      { params: storeId ? { storeId } : {} }
    );

    return res.data;
  }

  /* ====== NUEVO: Count by sweepstake ======
     GET /sweepstakes/participants/count-by-sweepstake?sweepstakeId=...&...
  */
  async getSweepstakeRegistrationsCount(params: {
    sweepstakeId: string;
    startDate?: string;
    endDate?: string;
    promotorId?: string;
    method?: 'qr' | 'pinpad' | 'tablet' | 'web' | 'referral' | 'promotor';
  }): Promise<SweepstakeRegistrationsCountResponse> {
    const res = await api.get<SweepstakeRegistrationsCountResponse>(
      '/sweepstakes/participants/count-by-sweepstake',
      { params }
    );

    return res.data;
  }
}

export const sweepstakesClient = new SweepstakesClient();

/* ===================== PRIZES ===================== */

export interface Prize {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  value?: number;
  details?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PrizesClient {
  async createPrize(data: Prize): Promise<Prize> {
    const res = await api.post('/sweepstakes/prizes/', data);
    return res.data;
  }

  async getPrizes(): Promise<Prize[]> {
    const res = await api.get('/sweepstakes/prizes/list');
    return res.data;
  }

  async getPrizeById(id: string): Promise<Prize> {
    const res = await api.get(`/sweepstakes/prizes/list/${id}`);
    return res.data;
  }

  async updatePrize(id: string, data: Partial<Prize>): Promise<Prize> {
    const res = await api.patch(`/sweepstakes/prizes/${id}`, data);
    return res.data;
  }

  async deletePrize(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`/sweepstakes/prizes/${id}`);
    return res.data;
  }
}

export const prizesClient = new PrizesClient();
