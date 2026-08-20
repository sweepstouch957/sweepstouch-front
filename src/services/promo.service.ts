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

/** Filtros del listado. La imagen está acá a propósito: cuando una pieza sale
 *  mal, la URL es lo único que se tiene a mano para encontrarla. */
export interface PromoFilters {
  page?: number;
  limit?: number;
  storeId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  type?: 'tablet' | 'app' | 'kiosk';
  category?: 'generic' | 'custom';
  sweepstakeId?: string;
  /** Busca en el título */
  q?: string;
  /** Coincidencia parcial contra imageMobile o imageDesktop */
  imageUrl?: string;
  isActive?: boolean;
}

/** En qué imagen buscar. 'any' cubre las dos, que es el caso normal. */
export type ImageField = 'any' | 'mobile' | 'desktop';

export interface ImageMatch {
  imageUrl: string;
  field?: ImageField;
  /** 'exact' por defecto: 'contains' puede alcanzar promos que no querías tocar */
  mode?: 'exact' | 'contains';
  /**
   * Las masivas son para las genéricas — las que se replican por tienda y por
   * eso no se pueden arreglar de a una. 'generic' por defecto.
   */
  category?: 'generic' | 'custom' | 'all';
}

export interface ImageMatchPreview {
  match: Required<ImageMatch>;
  promoTotal: number;
  genericTotal: number;
  total: number;
  /** Sorteos tocados, con nombre: el id no le dice nada a quien aprueba */
  sweepstakes: { id: string; name: string }[];
  stores: string[];
  promos: any[];
  generics: any[];
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
  async getAllPromosWithPagination(params?: PromoFilters) {
    // Los vacíos no se mandan: `status=` sin valor filtraba por cadena vacía
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    const res = await api.get('/promos', { params: clean });
    return res.data;
  }

  /* ─── Por imagen ───────────────────────────────────────────────────────────
     Las promos genéricas se replican por tienda: una imagen mala queda en 120
     documentos y no hay forma de encontrarlos si no se sabe a qué sorteo
     pertenecen. Estas tres trabajan sobre la URL, que es lo que sí se ve. */

  /** Qué se va a tocar, ANTES de tocarlo. */
  async findByImage(match: ImageMatch): Promise<ImageMatchPreview> {
    const res = await api.get('/promos/by-image', { params: match });
    return res.data;
  }

  /** Reemplaza la pieza mala por la buena en todas las promos que la usan. */
  async updateByImage(payload: ImageMatch & UpdatePromoPayload): Promise<AxiosResponse> {
    return api.put('/promos/by-image', payload);
  }

  /**
   * Retira la pieza. Con `deactivate` las apaga en vez de borrarlas — es lo que
   * casi siempre se quiere: sale de las tablets y el registro queda.
   * El backend exige `confirm: true`.
   */
  async removeByImage(
    payload: ImageMatch & { confirm: true; deactivate?: boolean }
  ): Promise<AxiosResponse> {
    return api.delete('/promos/by-image', { data: payload });
  }

  // (Opcional) Eliminar una promoción
  async deletePromo(promoId: string): Promise<AxiosResponse> {
    return api.delete(`/promos/${promoId}`);
  }
}

export const promoService = new PromoService();
