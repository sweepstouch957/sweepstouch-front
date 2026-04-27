// services/promoter.service.ts
import { api } from '@/libs/axios';
import { Store } from './store.service';

// ===== Tipos base =====
export interface Promoter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode?: string;
  profileImage?: string;
  status: string;
  rating?: number;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  store?: Store;
  accessCode?: string | null;
  totalShifts?: number;
  totalRegistrations?: number;
  totalParticipations?: number;
  totalAccumulatedMoney?: number;
  participationEarnings?: number;
  shiftEarnings?: number;
  newUsersRegistered?: number;
  existingUsersRegistered?: number;
  totalHoursWorked?: number;
  comment?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  generalInfo?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    status?: string;
    rating?: number;
    active?: boolean;
    createdAt?: string;
    lastLogin?: string;
  };
}

export interface NearbyPromoter extends Promoter {
  distanceMiles?: number;
  distanceMeters?: number;
  fullName?: string;
}

export interface PromoterDashboardStats {
  totalPromoters: number;
  /** Promotoras con turno activo en este momento */
  activePromoters: number;
  /** Cuentas habilitadas (active: true) */
  enabledPromoters: number;
  totalShifts: number;
  avgRating: number;
}

export type PromoterSortBy =
  | 'totalRegistrations'
  | 'rating'
  | 'totalAccumulatedMoney'
  | 'totalShifts'
  | 'firstName';

export interface PromoterFilters {
  status?: string;
  zipCode?: string;
  supermarketName?: string;
  active?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
  minRating?: number;
  sortBy?: PromoterSortBy;
  order?: 'asc' | 'desc';
}

export interface PromoterListResponse {
  data: Promoter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ===== Near-under (con canImpulse y paginación) =====
export type NearSortBy = 'customerCount' | 'name' | 'createdAt';
export type NearOrder = 'asc' | 'desc';

export interface StoreWithPromoters {
  store: {
    id: string;
    name: string;
    coordinates: [number, number];
    customerCount?: number;
    address?: string;
    zipCode?: string;
    imageUrl?: string;
    canImpulse?: boolean;
  };
  promoters: NearbyPromoter[];
}

export interface UnderNearbyResponse {
  radiusMi: number;
  audienceLt?: number;
  totalStores: number;
  page?: number;
  limit?: number;
  stores: StoreWithPromoters[];
}

// ===== Near-store =====
export interface NearStoreResponse {
  store: {
    id: string;
    name: string;
    coordinates: [number, number];
  };
  radiusKm: number;
  total: number;
  promoters: NearbyPromoter[];
}

export class PromoterService {
  async createPromoter(data: Partial<Promoter>): Promise<Promoter> {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      active: data.status === 'Activa',
      phoneNumber: data.phoneNumber,
    };
    const res = await api.post('/promoter/users', payload);
    return res.data;
  }

  async getAllPromoters(filters?: PromoterFilters): Promise<PromoterListResponse> {
    const res = await api.get('/promoter/users', { params: filters });
    // Support both old array response and new paginated { data, pagination }
    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        pagination: {
          page: 1,
          limit: res.data.length,
          total: res.data.length,
          pages: 1,
        },
      };
    }
    return res.data;
  }

  async getPromoterById(id: string): Promise<Promoter> {
    const res = await api.get(`/promoter/users/${id}`);
    return res.data;
  }

  async updatePromoter(id: string, data: Partial<Promoter>): Promise<Promoter> {
    const res = await api.put(`/promoter/users/${id}`, data);
    return res.data;
  }

  async deletePromoter(id: string): Promise<{ message: string; promoter: Promoter }> {
    const res = await api.delete(`/promoter/users/${id}`);
    return res.data;
  }

  async getPromoterStats(id: string, period: 'today' | 'week' | 'month' = 'today'): Promise<any> {
    const res = await api.get(`/promoter/users/${id}/stats`, { params: { period } });
    return res.data;
  }

  async getDashboardStats(): Promise<PromoterDashboardStats> {
    const res = await api.get('/promoter/users/stats');
    return res.data;
  }

  async saveComment(id: string, comment: string): Promise<{ ok: boolean; comment: string }> {
    const res = await api.patch(`/promoter/users/${id}/comment`, { comment });
    return res.data;
  }

  async login(email: string, password: string): Promise<{ token: string; user: Promoter }> {
    const res = await api.post('/promoter/users/login', { email, password });
    return res.data;
  }

  async getStoresUnderWithNearbyPromoters(opts?: {
    audienceLt?: number;
    radiusMi?: number;
    page?: number;
    limit?: number;
    sortBy?: NearSortBy;
    order?: NearOrder;
    search?: string;
  }): Promise<UnderNearbyResponse> {
    const {
      audienceLt = 1500,
      radiusMi = 20,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      search = '',
    } = opts || {};

    const res = await api.get('/promoter/users/near-under', {
      params: { audienceLt, radiusMi, page, limit, sortBy, order, search },
    });
    return res.data;
  }

  async getStoresUnder1500WithNearbyPromotersPaginated(params?: {
    radiusMi?: number;
    page?: number;
    limit?: number;
    sortBy?: NearSortBy;
    order?: NearOrder;
  }): Promise<UnderNearbyResponse> {
    const {
      radiusMi = 20,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = params || {};
    const res = await api.get('/promoter/users/near-under1500', {
      params: { radiusMi, page, limit, sortBy, order },
    });
    return res.data;
  }

  async getStoresUnder1500WithNearbyPromoters(radiusMi = 20): Promise<UnderNearbyResponse> {
    return this.getStoresUnderWithNearbyPromoters({
      audienceLt: 1500,
      radiusMi,
      page: 1,
      limit: 9999,
    });
  }

  async getPromotersNearStore(storeId: string, radiusKm = 50): Promise<NearStoreResponse> {
    const res = await api.get(`/promoter/users/near-store/${storeId}`, { params: { radiusKm } });
    return res.data;
  }
}

export const promoterService = new PromoterService();
