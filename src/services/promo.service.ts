import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';

export interface PromoPayload {
  title: string;
  imageMobile: string;
  imageDesktop?: string;
  link?: string;
  type: 'tablet' | 'app' | 'kiosk';
  category: 'generic' | 'custom';
  sweepstakeId?: string;
  storeId?: string;
  startDate: string; // ISO
  endDate: string; // ISO
}

export interface UpdatePromoPayload {
  title?: string;
  imageMobile?: string;
  imageDesktop?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export class PromoService {
  // Crear promoción individual
  async createPromo(data: PromoPayload): Promise<AxiosResponse> {
    return api.post('/promos', data);
  }

  // Crear promociones genéricas para todas las tiendas del sweepstake
  async createPromosBySweepstake(
    sweepstakeId: string,
    data: Omit<PromoPayload, 'storeId' | 'category'>
  ): Promise<AxiosResponse> {
    return api.post(`/promos/by-sweepstake/${sweepstakeId}`, data);
  }

  // Actualizar promociones genéricas de un sweepstake
  async updatePromosBySweepstake(
    sweepstakeId: string,
    data: UpdatePromoPayload
  ): Promise<AxiosResponse> {
    return api.put(`/promos/by-sweepstake/${sweepstakeId}`, data);
  }
  async getPromoById(promoId: string): Promise<AxiosResponse> {
    return api.get(`/promos/${promoId}`);
  }

  // ✅ Actualizar una promoción individual
  async updatePromo(promoId: string, data: UpdatePromoPayload): Promise<AxiosResponse> {
    return api.put(`/promos/${promoId}`, data);
  }

  // (Opcional) Obtener todas las promociones
  async getAllPromos(): Promise<any[]> {
    const res = await api.get('/promos');
    return res.data;
  }
  async getAllPromosWithPagination(params?: { page?: number; limit?: number; storeId: string }) {
    const res = await api.get('/promos', { params });
    return res.data;
  }

  // (Opcional) Eliminar una promoción
  async deletePromo(promoId: string): Promise<AxiosResponse> {
    return api.delete(`/promos/${promoId}`);
  }
}

export const promoService = new PromoService();
