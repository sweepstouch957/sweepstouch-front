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
  totalShifts?: number;
  totalRegistrations?: number;
  totalAccumulatedMoney?: number;
  participationEarnings?: number;
  shiftEarnings?: number;
  newUsersRegistered?: number;
  existingUsersRegistered?: number;
  totalHoursWorked?: number;
}

export interface NearbyPromoter extends Promoter {
  distanceMiles?: number;
  distanceMeters?: number;
  fullName?: string;
}

export interface PromoterDashboardStats {
  totalPromoters: number;
  activePromoters: number;
  totalShifts: number;
  avgRating: number;
}

export interface PromoterFilters {
  status?: string;
  zipCode?: string;
  supermarketName?: string;
  active?: boolean;
}

// ===== Near-under (con canImpulse y paginación) =====
export type NearSortBy = 'customerCount' | 'name' | 'createdAt';
export type NearOrder = 'asc' | 'desc';

export interface StoreWithPromoters {
  store: {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
    customerCount?: number;
    address?: string;
    zipCode?: string;
    imageUrl?: string;
    canImpulse?: boolean; // 👈 bandera del backend
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

  async getAllPromoters(filters?: PromoterFilters): Promise<Promoter[]> {
    const res = await api.get('/promoter/users', { params: filters });
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

  async login(email: string, password: string): Promise<{ token: string; user: Promoter }> {
    const res = await api.post('/promoter/users/login', { email, password });
    return res.data;
  }

  // ============== NUEVOS MÉTODOS near-under (paginados) ==============

  /**
   * Tiendas bajo cierta audiencia con promotoras cercanas (PAGINADO).
   * Backend: GET /promoter/near-under
   */
  async getStoresUnderWithNearbyPromoters(opts?: {
    audienceLt?: number; // default 1500
    radiusMi?: number; // default 20
    page?: number; // default 1
    limit?: number; // default 20
    sortBy?: NearSortBy; // 'customerCount' | 'name' | 'createdAt'
    order?: NearOrder; // 'asc' | 'desc'
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
      params: { audienceLt, radiusMi, page, limit, sortBy, order , search },
    });
    return res.data;
  }

  /**
   * Compat: versión "1500" (internamente llama al nuevo endpoint)
   * Backend mantiene /promoter/near-under1500 por compat.
   */
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

  // ====== (Legacy) método corto sin paginación -> redirige al nuevo ======
  async getStoresUnder1500WithNearbyPromoters(radiusMi = 20): Promise<UnderNearbyResponse> {
    // usa la versión paginada con defaults
    return this.getStoresUnderWithNearbyPromoters({
      audienceLt: 1500,
      radiusMi,
      page: 1,
      limit: 9999,
    });
  }

  // ===== Near-store =====
  async getPromotersNearStore(storeId: string, radiusKm = 50): Promise<NearStoreResponse> {
    const res = await api.get(`/promoter/users/near-store/${storeId}`, { params: { radiusKm } });
    return res.data;
  }
}

export const promoterService = new PromoterService();
