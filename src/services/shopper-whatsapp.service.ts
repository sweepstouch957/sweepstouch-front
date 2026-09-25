import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

/**
 * Una respuesta de un cliente de tienda al bot de WhatsApp (el que arranca con
 * el botón del RCS mixed o con un envío masivo desde el panel).
 *
 * `option` es el número que eligió — 1 quiere completar la compra, 2 sólo
 * estaba probando, 3 le gustó — y `sentiment` clasifica el texto libre, que
 * contesta la IA.
 */
export interface ShopperReply {
  _id: string;
  phone: string;
  storeSlug: string;
  storeName: string;
  customerName: string;
  option: 1 | 2 | 3 | null;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: string;
  summary: string;
  reply: string;
  createdAt: string;
}

export interface ShopperRepliesPage {
  ok: boolean;
  total: number;
  data: ShopperReply[];
}

export interface ShopperStats {
  ok: boolean;
  total: number;
  bySentiment: Record<string, number>;
  byOption: Record<string, number>;
  byStore: Record<string, number>;
}

/** Filtros de una tanda de envíos: una tienda, todas, y/o rango de alta del cliente. */
export interface BroadcastInput {
  storeSlugs?: string[];
  allStores?: boolean;
  /** Alta del cliente desde / hasta (ISO). Vacío = sin filtro de fecha. */
  from?: string;
  to?: string;
  limit?: number;
  dryRun?: boolean;
}

export interface BroadcastResult {
  ok: boolean;
  total: number;
  cap: number;
  capped?: boolean;
  dryRun?: boolean;
  jobId?: string;
  status?: string;
  message?: string;
  stores: { slug: string; name: string; count: number; error?: string }[];
}

export interface BroadcastJob {
  id: string;
  total: number;
  sent: number;
  failed: number;
  status: 'running' | 'done';
  startedAt: number;
  finishedAt: number | null;
  stores: { slug: string; name: string; count: number }[];
}

/** Estado de WhatsApp de un teléfono: cuándo se le mandó el saludo y qué contestó. */
export interface ShopperPhoneStatus {
  sentAt: string | null;
  sends: number;
  option: 1 | 2 | 3 | null;
  text: string;
  sentiment: string;
  summary: string;
  repliedAt: string | null;
}

/** Destinatario del saludo. La tienda se resuelve por slug; el resto es respaldo. */
export interface ShopperSendTarget {
  phone: string;
  name?: string;
  customerId?: string;
  storeSlug?: string;
  storeName?: string;
  storePhone?: string;
  storeId?: string;
}

export interface ShopperSendResult {
  ok: boolean;
  total: number;
  skipped: number;
  jobId?: string;
  status?: string;
  message?: string;
}

/** Últimos 10 dígitos: la clave con la que el bot guarda cada teléfono. */
export const phoneKey = (p: string) => String(p || '').replace(/\D/g, '').slice(-10);

/* ══════════ API ══════════ */

const BASE = '/whatsapp-bot/shopper';

export const shopperWhatsappService = {
  replies: async (params: {
    store?: string;
    sentiment?: string;
    option?: string;
    from?: string;
    to?: string;
    limit?: number;
    skip?: number;
  }): Promise<ShopperRepliesPage> => {
    const { data } = await api.get(`${BASE}/replies`, { params });
    return data;
  },

  stats: async (params: { store?: string; from?: string; to?: string }): Promise<ShopperStats> => {
    const { data } = await api.get(`${BASE}/stats`, { params });
    return data;
  },

  /** `dryRun: true` sólo cuenta a cuántos le tocaría, sin mandar nada. */
  broadcast: async (input: BroadcastInput): Promise<BroadcastResult> => {
    const { data } = await api.post(`${BASE}/broadcast`, input);
    return data;
  },

  /** Estado por teléfono, indexado por los últimos 10 dígitos. */
  byPhones: async (phones: string[]): Promise<Record<string, ShopperPhoneStatus>> => {
    if (!phones.length) return {};
    const { data } = await api.post(`${BASE}/by-phones`, { phones });
    return data?.status ?? {};
  },

  /** Saludo a una lista o a un número. Sin `resend` se saltan los que ya lo recibieron. */
  send: async (targets: ShopperSendTarget[], resend = false): Promise<ShopperSendResult> => {
    const { data } = await api.post(`${BASE}/send`, { targets, resend });
    return data;
  },

  broadcastStatus: async (): Promise<{ ok: boolean; jobs: BroadcastJob[] }> => {
    const { data } = await api.get(`${BASE}/broadcast/status`);
    return data;
  },
};
