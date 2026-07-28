// src/services/merchant.service.ts
import { api } from '@/libs/axios';
import { Store } from './store.service';

export interface MerchantUser {
  _id: string;
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  accessCode?: string;
  active?: boolean;
  createdAt?: string;
  store?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  role: string;
  password?: string;
  accessCode?: string;
  store?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  accessCode?: string;
  active?: boolean;
  address?: string;
  profileImage?: string;
}

class MerchantService {
  /** Get all merchant_manager users */
  async getMerchants(): Promise<MerchantUser[]> {
    const res = await api.get('/auth/users', {
      params: { role: 'merchant_manager' },
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Get stores assigned to a specific user */
  async getUserStores(userId: string): Promise<Store[]> {
    const res = await api.get(`/auth/users/${userId}/stores`);
    return res.data?.stores || [];
  }

  /** Replace store assignments for a user */
  async assignUserStores(userId: string, storeIds: string[]): Promise<Store[]> {
    const res = await api.put(`/auth/users/${userId}/stores`, { storeIds });
    return res.data?.stores || [];
  }

  /** Create a new user */
  async createUser(payload: CreateUserPayload): Promise<MerchantUser> {
    const res = await api.post('/auth/users', payload);
    return res.data?.user;
  }

  /** Update an existing user profile */
  async updateUser(userId: string, payload: UpdateUserPayload): Promise<MerchantUser> {
    const res = await api.patch(`/auth/users/profile/${userId}`, payload);
    return res.data?.user;
  }

  /** Create/attach the merchant user from a store (backend auto-generates accessCode) */
  async backfillFromStore(storeId: string): Promise<any> {
    const res = await api.post(`/auth/admin/backfill-from-store/${storeId}`);
    return res.data;
  }

  /** Regenerate the merchant user for a store (restores ex-cashier if needed) */
  async regenerateMerchant(storeId: string): Promise<any> {
    const res = await api.post(`/auth/admin/regenerate-merchant/${storeId}`);
    return res.data;
  }
}

export const merchantService = new MerchantService();
export default merchantService;
