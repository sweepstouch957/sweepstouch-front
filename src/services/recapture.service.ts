import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

/**
 * Recaptura de números: los clientes de una tienda INACTIVA no reciben nada. Si hay
 * una tienda activa cerca se les manda una campaña invitándolos a suscribirse a ella.
 */
export interface RecaptureNeighbor {
  id: string;
  name: string;
  slug: string;
  zipCode: string | null;
  address: string | null;
  /** [lng, lat] o null si la tienda no tiene ubicación cargada. */
  coords: [number, number] | null;
  audience: number;
  distanceKm: number | null;
  /** Por qué es vecina: mismo zip, distancia medida, o sólo misma zona postal (zip de 3 dígitos). */
  match: 'zip' | 'distance' | 'zone';
  /** Números de la inactiva que YA están en esta tienda (no reciben la campaña). */
  alreadyThere: number;
  /** De ésos, los agregados a mano desde este panel (se pueden deshacer). */
  added: number;
  /** Los que recibirían la invitación. */
  recoverable: number;
}

export interface RecaptureCampaign {
  id: string;
  title: string;
  targetStoreId: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  audience: number;
  sent: number;
}

export interface RecaptureRow {
  store: {
    id: string;
    name: string;
    zipCode: string | null;
    address: string | null;
    coords: [number, number] | null;
    /** Números activos (enviables) que le quedan a la tienda inactiva. */
    audience: number;
  };
  nearby: RecaptureNeighbor[];
  campaigns: RecaptureCampaign[];
}

export interface RecaptureResponse {
  radiusKm: number;
  totals: {
    inactiveStores: number;
    numbers: number;
    reachableNumbers: number;
    isolatedNumbers: number;
    campaigns: number;
  };
  rows: RecaptureRow[];
}

/* ══════════ API ══════════ */

export const recaptureService = {
  get: async (radiusKm: number): Promise<RecaptureResponse> => {
    const { data } = await api.get('/campaigns/audience/recapture', { params: { radiusKm } });
    return data;
  },
  /**
   * Agrega a la tienda activa los números de la inactiva que todavía no tiene.
   * direct=true → reciben las campañas de la tienda; false → sólo cuentan en su audiencia.
   */
  add: async (sourceStoreId: string, targetStoreId: string, direct: boolean): Promise<number> => {
    const { data } = await api.post('/campaigns/audience/recapture/add', { sourceStoreId, targetStoreId, direct });
    return data.added;
  },
  /** Saca de la tienda activa lo agregado con `add`. */
  undo: async (sourceStoreId: string, targetStoreId: string): Promise<number> => {
    const { data } = await api.post('/campaigns/audience/recapture/undo', { sourceStoreId, targetStoreId });
    return data.undone;
  },
};
