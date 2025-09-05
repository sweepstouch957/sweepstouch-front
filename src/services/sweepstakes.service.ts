import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';

interface RegisterParticipantPayload {
  sweepstakeId: string;
  customerPhone: string;
  storeId: string;
  createdBy?: string;
  method?: 'qr' | 'tablet' | 'pinpad' | 'web' | 'referral';
}

interface FilterParams {
  promotorId?: string;
  startDate: string;
  endDate: string;
  storeId?: string;
  method?: 'qr' | 'tablet' | 'pinpad' | 'web' | 'referral';
  sweepstakeId?: string;
}

interface FilterPromotors {
  startDate: string;
  endDate: string;
  storeIds?: string[];
}

interface Pagination {
  page: number;
  limit: number;
}

/* --------- Tipos para Checklist --------- */
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
  confirmationLink?: string; // solo para optinMedia
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

export interface StoreSweepstake {
  storeId: string;
  storeName: string;
  storeType?: 'elite' | 'basic' | 'free';
  storeImage: string;
  storeCustomerCount: number;
  totalParticipations: number;
}

export interface Sweepstakes {
  id: string;
  _id?: string;
  name: string;
  participants: number;
  stores: number;
  startDate: string; // ISO
  endDate: string;   // ISO
  status: string;
  image: string;
  description?: string;
  hasQr?: boolean;
  participationMessage?: string;
  rules?: string;
  checklist?: Checklist;
  checklistProgress?: number; // 0..7
  prize?: Prize[] | string[];
  hasOptinLink?: boolean;
  confirmationLink?: string | null;
  createdAt?: string;
}

interface StoreSweepstakeResponse {
  total: number;
  page: number;
  limit: number;
  data: StoreSweepstake[];
}

export class SweepstakesClient {
  /* ------------ Participants ------------ */
  async registerParticipant(data: RegisterParticipantPayload): Promise<AxiosResponse> {
    return api.post('/sweepstakes/participants/register', data);
  }

  async getParticipants(sweepstakeId: string, storeId?: string): Promise<any[]> {
    const res = await api.get(`/sweepstakes/participants/${sweepstakeId}/participants`, {
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

  /* --------------- Reports -------------- */
  async getMonthlyParticipants(): Promise<any> {
    const res = await api.get('/sweepstakes/participants/reports');
    return res.data;
  }

  /* -------------- Sweepstakes ----------- */
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

  /* -------- NUEVO: Checklist & Count ----- */
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

  async getChecklistProgress(
    sweepstakeId: string
  ): Promise<{ totalSteps: number; completed: number; progressPercent: number; checklist: Checklist }> {
    const res = await api.get(`/sweepstakes/${sweepstakeId}/checklist/progress`);
    return res.data;
  }

  async getSweepstakeCount(): Promise<number> {
    const res = await api.get('/sweepstakes/count');
    return res.data.total ?? 0;
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

  // opcionales por si los quieres en UI:
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
