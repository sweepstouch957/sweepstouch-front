import { api } from '@/libs/axios';

/**
 * Compartir base entre negocios.
 *
 * Una tienda sin campañas tiene la audiencia parada. Compartir es darle acceso
 * a esos contactos a una tienda vecina que sí manda: se agrega el id del
 * destino a `Customer.stores`, no se mueve a nadie — el origen conserva su base
 * intacta.
 *
 * Cada operación queda registrada con los ids exactos que tocó, y por eso se
 * puede revertir sin llevarse puestos a los clientes que ya estaban en el
 * destino por su cuenta.
 */

export interface ShareStoreRef {
  id: string;
  name: string;
  slug?: string;
}

export interface ShareActor {
  id?: string;
  name?: string;
}

export interface SharePreview {
  from: ShareStoreRef;
  to: ShareStoreRef;
  /** Contactos que tiene el origen. */
  totalInSource: number;
  /** Ya pertenecen a las dos: no se tocan. */
  alreadyInTarget: number;
  /** Los que la operación agregaría. Es el número que importa. */
  willShare: number;
  exceedsLimit: boolean;
  maxShare: number;
  sample: { phoneNumber: string; name: string | null }[];
}

export interface ShareResult {
  success: true;
  shareId: string;
  from: ShareStoreRef;
  to: ShareStoreRef;
  shared: number;
  modified: number;
  alreadyInTarget: number;
  targetCustomerCount: number;
}

export interface RevertResult {
  success: true;
  shareId: string;
  reverted: number;
  ofCustomers: number;
  targetCustomerCount: number;
}

export interface ShareRecord {
  id: string;
  _id: string;
  fromStore: ShareStoreRef;
  toStore: ShareStoreRef;
  customersCount: number;
  alreadyInTarget: number;
  status: 'applied' | 'reverted';
  appliedAt: string;
  appliedBy: ShareActor | null;
  revertedAt: string | null;
  revertedBy: ShareActor | null;
  revertedCount: number;
  note?: string;
}

export interface ShareListResponse {
  data: ShareRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface ShareBody {
  fromStoreId: string;
  toStoreId: string;
  /** Por defecto sólo los activos: mandarle a un número dado de baja no sirve. */
  activeOnly?: boolean;
  note?: string;
  actorId?: string;
  actorName?: string;
}

const BASE = '/customers/share';

export const customerShareClient = {
  async preview(body: Pick<ShareBody, 'fromStoreId' | 'toStoreId' | 'activeOnly'>) {
    const res = await api.post(`${BASE}/preview`, body);
    return res.data as SharePreview;
  },

  async apply(body: ShareBody) {
    const res = await api.post(BASE, body);
    return res.data as ShareResult;
  },

  async revert(shareId: string, actor?: ShareActor) {
    const res = await api.post(`${BASE}/${shareId}/revert`, {
      actorId: actor?.id,
      actorName: actor?.name,
    });
    return res.data as RevertResult;
  },

  async list(params: {
    page?: number;
    limit?: number;
    status?: 'applied' | 'reverted';
    storeId?: string;
  } = {}) {
    const res = await api.get(BASE, { params });
    return res.data as ShareListResponse;
  },
};

export default customerShareClient;
