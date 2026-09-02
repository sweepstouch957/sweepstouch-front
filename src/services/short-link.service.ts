import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

/**
 * El link corto permanente de una tienda: `swtrcs.com/s/XXXXXX` → el linktree
 * de esa tienda (`links.sweepstouch.com/?slug=<slug>`).
 *
 * Se crea una vez y no cambia: es el que se manda por WhatsApp, se pone en el
 * perfil de Instagram y se imprime. `hits` son los clicks acumulados.
 */
export interface LinktreeShortLink {
  code: string;
  shortUrl: string;
  /** URL larga a la que redirige */
  target: string;
  storeSlug: string;
  hits: number;
  createdAt: string;
}

export interface LinktreeShortLinkList {
  ok: boolean;
  count: number;
  totalClicks: number;
  links: LinktreeShortLink[];
}

export interface BackfillResult {
  ok: boolean;
  /** Tiendas activas con slug */
  stores: number;
  existing: number;
  created: number;
  links: LinktreeShortLink[];
}

/* ══════════ API ══════════ */

const BASE = '/tracking/short-link/linktree';

export const shortLinkService = {
  /** Todos los links permanentes, uno por tienda, ordenados por clicks. */
  list: async (): Promise<LinktreeShortLinkList> => {
    const { data } = await api.get(BASE);
    return data;
  },

  /** El de una tienda. Lo crea si no existe; `force` rehace el destino sobre el mismo código. */
  forStore: async (slug: string, force = false): Promise<LinktreeShortLink> => {
    const { data } = await api.get(`${BASE}/${slug}`, { params: { force: force ? 1 : undefined } });
    return data.data;
  },

  /** Crea los que falten para todas las tiendas activas con slug. */
  backfill: async (): Promise<BackfillResult> => {
    const { data } = await api.post(`${BASE}/backfill`);
    return data;
  },
};
