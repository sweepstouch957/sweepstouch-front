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
  name: string;
  participants: number;
  stores: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: string;
  image: string;
}
interface StoreSweepstakeResponse {
  total: number;
  page: number;
  limit: number;
  data: StoreSweepstake[];
}

export class SweepstakesClient {
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
    const res = await api.get('/sweepstakes/participants/by-promotor', {
      params: filters,
    });
    return res.data;
  }

  async getRegistrationsByStore(filters: FilterParams): Promise<any[]> {
    const res = await api.get('/sweepstakes/participants/metrics', {
      params: filters,
    });

    return res.data;
  }

  async getStoresBySweepstkes(id: string): Promise<any[]> {
    const res = await api.get(`/sweepstakes/${id}/stores`);
    return res.data;
  }

  async getStoresBySweepstkesFiltered(
    id: string,
    filters?: Pagination
  ): Promise<StoreSweepstakeResponse> {
    const res = await api.get(`/sweepstakes/${id}/stores`, {
      params: filters,
    });
    return res.data;
  }

  async getSweepstakesPromotors(filters: FilterPromotors): Promise<any> {
    const res = await api.get('/sweepstakes/participants/audit', {
      params: filters,
    });
    return res.data;
  }

  async getMonthlyParticipants(): Promise<any> {
    const res = await api.get('/sweepstakes/participants/reports');
    return res.data;
  }

  async getSweepstakes(filters?: { status?: string; name?: string }): Promise<Sweepstakes[]> {
    const res = await api.get('/sweepstakes', { params: filters });
    return res.data;
  }
  async getSweepstakeById(id: string): Promise<Sweepstakes> {
    const res = await api.get(`/sweepstakes/${id}`);
    return res.data;
  }S
}

export const sweepstakesClient = new SweepstakesClient();
