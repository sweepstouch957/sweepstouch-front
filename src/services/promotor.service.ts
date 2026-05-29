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
  lastLocation?: {
    type: string;
    coordinates: [number, number];
  };
  lastActive?: string;
  isOnline?: boolean;
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

  async getAllLocatedPromoters(): Promise<{ promoters: NearbyPromoter[] }> {
    const res = await api.get('/promoter/users/with-location');
    return res.data;
  }
}

export const promoterService = new PromoterService();

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface RankedPromoter {
  promoterId: string;
  promoterName: string;
  promoterEmail: string;
  totalEarnings: number;
  totalParticipations: number;
  newCustomers: number;
  existingCustomers: number;
  totalPaid?: number;
  campaignSentCount?: number;
}

export interface PromoterRankingResponse {
  ranking: RankedPromoter[];
  totals: {
    grandTotalEarnings: number;
    grandTotalParticipations: number;
    grandTotalNewCustomers: number;
    grandTotalExistingCustomers: number;
    grandTotalPaid?: number;
    grandTotalCampaignSent?: number;
  };
  period: string;
}

export interface ParticipationOverview {
  totalParticipations: number;
  newUsers: number;
  existingUsers: number;
  totalPoints: number;
  totalEarnings: number;
  uniqueStoresCount: number;
  uniquePromotersCount: number;
  uniqueCustomersCount: number;
  totalPaid?: number;
  campaignSentCount?: number;
}

export async function getPromoterRanking(params?: {
  period?: 'today' | 'week' | 'month';
  limit?: number;
}): Promise<PromoterRankingResponse> {
  const res = await api.get<PromoterRankingResponse>('/promoter/metrics/ranking', { params });
  return res.data;
}

export async function getParticipationOverview(params?: {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  promoterId?: string;
}): Promise<ParticipationOverview> {
  const res = await api.get<ParticipationOverview>('/promoter/participations/stats/overview', { params });
  return res.data;
}

// ─── Promoter SMS Audit ──────────────────────────────────────────────────────

export interface PromoterSmsAuditRow {
  participantId: string;
  phone: string;
  registeredAt: string;
  smsStatus: 'pending' | 'delivered' | 'failed' | 'undelivered' | 'no_sms';
  smsMessageId: string | null;
  noSmsReason: 'no_message_id' | null;
  smsDeliveredAt: string | null;
  isPhoneValid: boolean | null;
  phoneValidationReason: string | null;
  isNewUser: boolean;
  method: string;
  auditedAt: string | null;
  storeId: string | null;
  storeName: string;
}

export interface PromoterSmsAuditSummary {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  noSms: number;
  invalid: number;
  unknown: number;
  deliveredPct: number;
  failedPct: number;
  noSmsPct: number;
  invalidPct: number;
}

export interface PromoterSmsAuditResponse {
  promoterId: string;
  dateRange: { startDate: string; endDate: string };
  summary: PromoterSmsAuditSummary;
  rows: PromoterSmsAuditRow[];
}

export async function getPromoterSmsAudit(params: {
  promoterId: string;
  startDate?: string;
  endDate?: string;
  storeId?: string;
}): Promise<PromoterSmsAuditResponse> {
  const res = await api.get<PromoterSmsAuditResponse>('/promoter/participations/sms-audit', {
    params,
    withCredentials: true,
  });
  return res.data;
}

export interface ValidatePhoneResponse {
  success: boolean;
  isPhoneValid: boolean;
  reason: string;
  lookupDetails?: any;
}

export async function validatePromoterPhone(participantId: string): Promise<ValidatePhoneResponse> {
  const res = await api.post<ValidatePhoneResponse>('/promoter/participations/sms-audit/validate-phone', {
    participantId,
  }, {
    withCredentials: true,
  });
  return res.data;
}

// ─── Daily Registrations ─────────────────────────────────────────────────────

export interface DailyRegistration {
  date: string;
  totalParticipations: number;
  newCustomers: number;
  existingCustomers: number;
}

export interface DailyRegistrationsResponse {
  dailyStats: DailyRegistration[];
  period: {
    startDate: string | null;
    endDate: string;
  };
}

export async function getDailyRegistrations(params?: {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month';
}): Promise<DailyRegistrationsResponse> {
  const res = await api.get<DailyRegistrationsResponse>('/promoter/metrics/daily', { params });
  return res.data;
}

