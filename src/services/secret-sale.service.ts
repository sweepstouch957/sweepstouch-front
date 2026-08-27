import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export interface SecretSaleStore {
  _id: string;
  name?: string;
  image?: string;
  slug?: string;
}

export interface SecretSale {
  _id: string;
  storeId: SecretSaleStore | string;
  title: string;
  description?: string;
  /** Flyer que ve la persona después de dejar su perfil */
  flyerImage: string;
  startDate: string; // ISO
  endDate: string; // ISO — vencimiento
  isActive: boolean;
  /** Contactos capturados por esta sale (lo calcula el backend en el listado) */
  leadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecretSaleLead {
  _id: string;
  storeId: string;
  secretSaleId?: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164 (+1XXXXXXXXXX) */
  phone: string;
  unlockCount: number;
  lastUnlockAt: string;
  createdAt: string;
}

/** El QR de la tienda: uno solo, y siempre el mismo. */
export interface SecretSaleQr {
  _id: string;
  storeId: string;
  slug: string;
  /** Destino: <linktree>/secret-sales?slug=<slug> */
  link: string;
  qrUrl: string;
  createdAt: string;
}

export interface CreateSecretSaleDto {
  storeId: string;
  title: string;
  description?: string;
  flyerImage: string;
  startDate: string; // ISO
  endDate: string; // ISO
  isActive?: boolean;
}

export type UpdateSecretSaleDto = Partial<Omit<CreateSecretSaleDto, 'storeId'>>;

/* ══════════ API ══════════ */

// Vive dentro de promo-service: una secret sale es una promo con vencimiento
// que se paga con un contacto. Por eso cuelga de /promos y no de un prefijo nuevo.
const BASE = '/promos/secret-sales';

export const secretSaleService = {
  list: async (params: { storeId?: string; includeExpired?: boolean }): Promise<SecretSale[]> => {
    const { data } = await api.get(BASE, {
      params: { storeId: params.storeId, includeExpired: params.includeExpired ? 1 : undefined },
    });
    return data.data;
  },

  create: async (dto: CreateSecretSaleDto): Promise<SecretSale> => {
    const { data } = await api.post(BASE, dto);
    return data.data;
  },

  update: async (id: string, dto: UpdateSecretSaleDto): Promise<SecretSale> => {
    const { data } = await api.put(`${BASE}/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  /**
   * QR de la tienda. Lo genera el backend la primera vez y después lo devuelve
   * de la base: el cartel pegado en la caja es siempre el mismo, lo que cambia
   * es el flyer que hay detrás. `force` sólo para rehacerlo a propósito.
   */
  qr: async (storeId: string, force = false): Promise<SecretSaleQr> => {
    const { data } = await api.get(`${BASE}/qr`, {
      params: { storeId, force: force ? 1 : undefined },
    });
    return data.data;
  },

  leads: async (id: string): Promise<SecretSaleLead[]> => {
    const { data } = await api.get(`${BASE}/${id}/leads`);
    return data.data;
  },
};
