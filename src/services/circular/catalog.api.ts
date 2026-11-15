/** Catálogo de la tienda: productos, orden, fotos, detalles y limpieza. */
import { api } from '@/libs/axios';
import type {
  CatalogCleanupPlan,
  CatalogSource,
  CatalogSummary,
  DetailsJob,
  ParsedListProduct,
  RescanJob,
  StoreProduct,
} from './types';

export const catalogApi = {
  /** Catálogo persistente de la tienda (StoreProduct), sólo los visibles en RCS. */
  async getStoreCatalog(
    storeSlug: string
  ): Promise<{ storeSlug: string; count: number; items: any[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog`, {
      params: { visible: 'true' },
    });
    return res.data;
  },

  /** Catálogo COMPLETO para administración (incluye ocultos y sin oferta). */
  /** Catálogo del panel, paginado y buscable en el servidor (`limit` + `page` + `q`). */
  async getCatalogAdmin(
    storeSlug: string,
    opts?: {
      page?: number;
      limit?: number;
      q?: string;
      circularId?: string;
      when?: 'live' | 'next';
      /** Panel: sólo visibles, sólo ocultos o sólo los que esperan fecha. */
      show?: 'visible' | 'hidden' | 'pending';
    }
  ): Promise<{
    storeSlug: string;
    count: number;
    items: StoreProduct[];
    cleaning?: boolean;
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog`, {
      params: {
        ...(opts?.limit ? { limit: opts.limit, page: opts.page || 1 } : {}),
        ...(opts?.q?.trim() ? { q: opts.q.trim() } : {}),
        ...(opts?.show === 'pending'
          ? { pending: 'true' }
          : opts?.show
            ? { visible: String(opts.show === 'visible') }
            : {}),
        // Panel por fuente: sólo los productos de ese flyer/circular (vigente o programado).
        ...(opts?.circularId ? { circularId: opts.circularId, when: opts.when || 'live' } : {}),
      },
    });
    return res.data;
  },

  /** Vista previa de la lista de productos en texto (al agendar una campaña). */
  async parseProductList(
    text: string,
    storeSlug?: string
  ): Promise<{ ok: boolean; count: number; products: ParsedListProduct[] }> {
    const res = await api.post(`/circulars/campaign-import/parse-list`, { text, storeSlug });
    return res.data;
  },

  /** Fuentes activas del catálogo (flyer/circular vigente o programado) con cuántos productos tiene cada una. */
  async getCatalogSources(
    storeSlug: string
  ): Promise<{ ok: boolean; total: number; sources: CatalogSource[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog/sources`);
    return res.data;
  },

  /** Limpieza fija de lo ya guardado: GET cuenta sin aplicar, POST aplica (nunca pisa lo corregido a mano). */
  async catalogCleanup(storeSlug: string, apply: boolean): Promise<CatalogCleanupPlan> {
    const res = apply
      ? await api.post(`/circulars/store/${storeSlug}/catalog/cleanup`, {})
      : await api.get(`/circulars/store/${storeSlug}/catalog/cleanup`);
    return res.data;
  },

  /** Cuántos productos ve el cliente hoy (y por qué): para la tarjeta de estado del panel. */
  async getCatalogSummary(storeSlug: string): Promise<CatalogSummary> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog/summary`);
    return res.data;
  },

  /** Categorías de ESA tienda (las que ya usa + la lista base) para el selector del panel. */
  async getStoreCategories(storeSlug: string): Promise<string[]> {
    const res = await api.get(`/circulars/store/${storeSlug}/categories`);
    return res.data?.categories || [];
  },

  /** Edita un producto del catálogo (precio, oferta, visibilidad…). */
  async updateStoreProduct(
    id: string,
    patch: Partial<
      Pick<
        StoreProduct,
        | 'name'
        | 'price'
        | 'originalPrice'
        | 'savings'
        | 'onPromotion'
        | 'hasOffer'
        | 'visibleInRcs'
        | 'stock'
        | 'maxPerCustomer'
        | 'offerCondition'
        | 'category'
        | 'unit'
        | 'imageUrl'
        | 'position'
        | 'brand'
        | 'size'
        | 'presentation'
        | 'saleUnit'
        | 'barcode'
      >
    >
  ): Promise<{ ok: boolean; item: StoreProduct }> {
    const res = await api.patch(`/circulars/store-product/${id}`, patch);
    return res.data;
  },

  /** Orden del catálogo: una sola llamada; `offset` = inicio de la página (catálogo paginado). */
  async saveCatalogOrder(storeSlug: string, productIds: string[], offset = 0) {
    if (new Set(productIds).size !== productIds.length)
      throw new Error('Ids repetidos en el orden.');
    const res = await api.patch('/circulars/store-product/reorder', { ids: productIds, offset });
    if (!res.data?.ok) throw new Error('El backend no confirmó el orden.');
    return res.data;
  },

  /* ── Rescanear fotos (re-ubicar en el circular, recortar, limpiar; si no está, generar) ── */
  async rescanPhotos(
    storeSlug: string,
    mode: 'missing' | 'all' | 'ids',
    ids?: string[]
  ): Promise<{ ok: boolean; job: RescanJob }> {
    const res = await api.post(`/circulars/catalog/store/${storeSlug}/rescan-photos`, {
      mode,
      ...(ids?.length ? { ids } : {}),
    });
    return res.data;
  },

  async rescanPhotosStatus(storeSlug: string): Promise<{ ok: boolean; job: RescanJob | null }> {
    const res = await api.get(`/circulars/catalog/store/${storeSlug}/rescan-photos`);
    return res.data;
  },

  async rescanProductPhoto(
    id: string
  ): Promise<{ ok: boolean; item: StoreProduct; relocated: boolean }> {
    const res = await api.post(
      `/circulars/store-product/${id}/rescan-photo`,
      {},
      { timeout: 240_000 }
    );
    return res.data;
  },

  /* ── Completar marca / tamaño releyendo el flyer o el circular ── */
  async fillDetails(
    storeSlug: string,
    source: 'flyer' | 'circular'
  ): Promise<{ ok: boolean; job: DetailsJob }> {
    const res = await api.post(`/circulars/catalog/store/${storeSlug}/fill-details`, { source });
    return res.data;
  },

  async fillDetailsStatus(storeSlug: string): Promise<{ ok: boolean; job: DetailsJob | null }> {
    const res = await api.get(`/circulars/catalog/store/${storeSlug}/fill-details`);
    return res.data;
  },

  /** "Arreglar productos de la lista": vuelca los precios que ya llegaron a su fecha y deja
   *  visibles en el Pre-RCS SOLO los productos del flyer VIGENTE (el que cubre hoy); oculta el
   *  resto. Sin flyer vigente (`circularId` null) oculta lo que vino de un flyer vencido. */
  async syncVisibility(
    storeSlug: string,
    only?: 'flyer' | 'circular'
  ): Promise<{
    ok: boolean;
    circularId: string | null;
    circularTitle: string;
    inCircular: number;
    shown: number;
    hidden: number;
    applied: number;
    duplicates?: number;
    duplicateExamples?: string[];
  }> {
    const res = await api.post(`/circulars/store/${storeSlug}/sync-visibility`, null, {
      params: only ? { only } : {},
    });
    return res.data;
  },

  /** El último día del flyer vale hasta 23:59 NY. `until` (YYYY-MM-DD) = día que dice el arte para el último flyer. */
  async fixEndOfDay(
    storeSlug: string,
    until?: string
  ): Promise<{
    ok: boolean;
    fixed: Array<{
      circularId: string;
      title: string;
      from: string;
      to: string;
      status: string;
      revived: boolean;
    }>;
    shown: number;
    circularTitle: string;
  }> {
    const res = await api.post(
      `/circulars/store/${storeSlug}/fix-end-of-day`,
      until ? { until } : {}
    );
    return res.data;
  },

  /** Con flyer vigente: sólo queda visible lo que ese flyer cargó; todo lo demás se oculta. */
  async hideCircularProducts(
    storeSlug: string,
    circularId?: string
  ): Promise<{
    ok: boolean;
    flyer: string;
    when: 'live' | 'next';
    revived: boolean;
    kept: number;
    hidden: number;
    shown: number;
  }> {
    const res = await api.post(
      `/circulars/store/${storeSlug}/catalog/hide-circular`,
      circularId ? { circularId } : {}
    );
    return res.data;
  },

  /** Limpia con IA los recortes crudos del catálogo (y genera los sin foto). Background. */
  async cleanCatalogImages(
    storeSlug: string
  ): Promise<{ ok: boolean; queued: number; pending: number; verifying?: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/clean-images`);
    return res.data;
  },

  /** Imagen IA del producto: sin fondo, webp liviano, último gpt-image. ~10 s. */
  async aiProductImage(
    name: string,
    category?: string,
    instructions?: string
  ): Promise<{ imageUrl: string }> {
    const res = await api.post('/ai/product-image', { name, category, instructions });
    return res.data;
  },

  /** Limpia con IA una imagen existente (captura pegada, recorte del flyer): deja SOLO el
   *  producto, sin precio ni texto, sin fondo, en HD y webp liviano. `box` (% 0–100)
   *  recorta antes esa zona de la imagen (el circular). ~30–60 s. */
  async aiCleanProductImage(
    imageUrl: string,
    name?: string,
    box?: { x: number; y: number; w: number; h: number },
    instructions?: string
  ): Promise<{ imageUrl: string }> {
    const res = await api.post(
      '/ai/product-image-edit',
      { imageUrl, name, box, instructions },
      { timeout: 180_000 }
    );
    return res.data;
  },

  /** Crea un producto manual en el catálogo (upsert por nombre/sku). */
  async createStoreProduct(body: {
    storeSlug: string;
    name: string;
    price?: string;
    originalPrice?: string;
    savings?: string;
    category?: string;
    imageUrl?: string;
  }): Promise<{ ok: boolean; item: StoreProduct }> {
    const res = await api.post('/circulars/store-product', body);
    return res.data;
  },

  /** Elimina un producto del catálogo. */
  /** Borra TODOS los productos del catálogo de la tienda (y, opcionalmente, vacía los circulares vivos para re-extraer). */
  async clearCatalog(
    storeSlug: string,
    opts?: { circulars?: boolean }
  ): Promise<{ ok: boolean; deleted: number; circulars: number }> {
    const res = await api.delete(
      `/circulars/store/${storeSlug}/catalog${opts?.circulars ? '?circulars=1' : ''}`
    );
    return res.data;
  },

  async deleteStoreProduct(id: string): Promise<{ ok: boolean }> {
    const res = await api.delete(`/circulars/store-product/${id}`);
    return res.data;
  },
};
