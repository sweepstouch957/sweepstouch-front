import { api } from '@/libs/axios';
import { Store } from './store.service';

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

// Promotoras cercanas: el backend incluye distanceKm/distanceMeters y fullName
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

// Respuesta: /promoter/users/near-under1500
export interface StoreWithPromoters {
  store: {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat]
  };
  promoters: NearbyPromoter[];
}
export interface Under1500NearbyResponse {
  radiusMi: number;
  totalStores: number;
  stores: StoreWithPromoters[];
}

// Respuesta: /promoter/users/near-store/:storeId
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
    // ✅ fix: faltaba la slash antes del id
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

  // 🔥 Nuevo: tiendas <1500 con promotoras <= radiusKm (sin paginación)
  async getStoresUnder1500WithNearbyPromoters(radiusMi = 20): Promise<Under1500NearbyResponse> {
    const res = await api.get('/promoter/users/near-under1500', { params: { radiusMi } });
    return res.data;
  }

  // 🔥 Nuevo: promotoras cerca de una tienda específica (sin paginación)
  async getPromotersNearStore(storeId: string, radiusKm = 50): Promise<NearStoreResponse> {
    const res = await api.get(`/promoter/users/near-store/${storeId}`, { params: { radiusKm } });
    return res.data;
  }
}

export const promoterService = new PromoterService();
