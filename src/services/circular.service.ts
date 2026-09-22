// services/circulars.service.ts
import { api } from '@/libs/axios';

export type CircularStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';

export interface Circular {
  _id: string;
  store: string; // ObjectId
  storeSlug: string;
  title: string;
  fileKey: string;
  fileUrl: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: CircularStatus;
  expiringSoon?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Producto del catálogo persistente de la tienda (StoreProduct en circular-service). */
export interface StoreProduct {
  _id: string;
  storeSlug: string;
  name: string;
  brand?: string;
  size?: string;
  /** Entero / en piezas / bandeja 2 lb… lo que la IA suele leer mal. */
  presentation?: string;
  /** Unidad de venta: lb, kg, unidad, paquete. */
  saleUnit?: string;
  barcode?: string;
  category?: string;
  unit?: string;
  imageUrl?: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  offerCondition?: string;
  stock?: number | null;
  maxPerCustomer?: number | null;
  onPromotion?: boolean;
  hasOffer?: boolean;
  visibleInRcs?: boolean;
  position?: number;
  updatedAt?: string;
}

/** Banner de campaña que el cliente ve arriba de su lista (linktree /prercs). */
export interface StoreBanner {
  _id: string;
  storeSlug: string;
  imageUrl: string;
  title?: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  /** Lo sacó la IA del header del flyer al extraer productos. */
  auto?: boolean;
}

export interface UploadCircularPayload {
  file: File | Blob;
  storeSlug?: string;
  schedule?: 'current' | 'next';
  startDate?: string;
  endDate?: string;
  title?: string;
  overridePassword?: string;
}

export interface ScheduleCircularPayload {
  storeSlug: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export interface ReschedulePayload {
  circularId: string;
  startDate: string;
  endDate: string;
  title?: string;
}

export interface OverviewStoreInfo {
  _id: string; // slug
  last: Circular;
  store?: {
    _id: string;
    slug: string;
    name: string;
    image?: string;
    customerCount?: number;
    type?: string;
    address?: string;
    zipCode?: string;
    membershipType?: string;
  };
}

export interface OverviewResponse {
  totals: { active: number; scheduled: number; expired: number };
  byStore: OverviewStoreInfo[];
}

export class CircularService {
  async upload(payload: UploadCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.storeSlug) form.append('storeSlug', payload.storeSlug);
    if (payload.schedule) form.append('schedule', payload.schedule);
    if (payload.startDate) form.append('startDate', payload.startDate);
    if (payload.endDate) form.append('endDate', payload.endDate);
    if (payload.title) form.append('title', payload.title);
    if (payload.overridePassword) form.append('overridePassword', payload.overridePassword);

    const res = await api.post('/circulars/upload', form);
    return res.data;
  }

  async schedule(payload: ScheduleCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/schedule', payload);
    return res.data;
  }

  /** Reprograma un circular existente (nuevas fechas o título) — backend: PUT /circulars/:id */
  async reschedule(payload: ReschedulePayload): Promise<{ ok: boolean; circular: Circular }> {
    const { circularId, ...body } = payload;
    const res = await api.put(`/circulars/${circularId}`, body);
    return res.data;
  }

  async attachFile(
    circularId: string,
    file: File | Blob
  ): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.patch(`/circulars/${circularId}/attach`, form);
    return res.data;
  }

  /** `aiImages: false` = no limpiar las imágenes con IA ahora (es lo caro: una generación
   *  por producto). Quedan los recortes y se limpian después desde Productos. */
  async extractProducts(circularId: string, maxProducts?: number, opts?: { aiImages?: boolean }): Promise<any> {
    const res = await api.post(`/circulars/${circularId}/extract-products`, {
      maxProducts: maxProducts || 0,
      ...(opts?.aiImages === false ? { aiImages: false } : {}),
    });
    return res.data;
  }

  /** Segunda pasada: re-escanea el circular POR SECCIONES (para los productos chicos) y
   *  suma sólo los que todavía no tiene. No toca los existentes ni sus imágenes. */
  async addMissingProducts(circularId: string): Promise<{ ok: boolean; added: number; found: number; productCount: number }> {
    const res = await api.post(`/circulars/${circularId}/extract-products-add`, { merge: true });
    return res.data;
  }

  /** Suma al circular los productos de OTRA imagen (el arte de la última campaña):
   *  sólo los que todavía no tiene. `maxProducts` 0 = todos, por secciones. */
  async addProductsFromImage(
    circularId: string,
    sourceUrl: string,
    maxProducts = 0,
    opts?: { aiImages?: boolean }
  ): Promise<{ ok: boolean; added: number; found: number; productCount: number }> {
    const res = await api.post(`/circulars/${circularId}/extract-products-add`, {
      merge: true,
      sourceUrl,
      maxProducts,
      ...(opts?.aiImages === false ? { aiImages: false } : {}),
    });
    return res.data;
  }

  /** Tienda sin circular esta semana: crea uno usando una imagen ya alojada (el arte de
   *  la campaña) como flyer. Semana actual por defecto. La extracción se dispara aparte. */
  /**
   * Circular a partir de una imagen ya hospedada (el arte de la última campaña).
   * `draft`: se crea como borrador — sirve de percha para extraerle los productos sin
   * publicarlo como el circular de la semana en el linktree y el Pre-RCS.
   */
  async createFromImageUrl(
    storeSlug: string,
    imageUrl: string,
    title?: string,
    opts?: { draft?: boolean }
  ): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/from-url', {
      storeSlug,
      imageUrl,
      title,
      ...(opts?.draft ? { status: 'draft' } : {}),
    });
    return res.data;
  }

  /** Imagen de la primera página del circular (los PDF se renderizan una vez y se cachea). */
  async getPreviewImage(circularId: string): Promise<{ ok: boolean; url: string }> {
    const res = await api.get(`/circulars/${circularId}/preview-image`);
    return res.data;
  }

  /** Sin circular vigente: baja el PDF de la semana desde `store.circularssUrl`, lo
   *  guarda y crea el circular de la semana actual. La extracción se dispara aparte. */
  async importFromStoreUrl(storeSlug: string): Promise<{ ok: boolean; circular: Circular; fileType: string; sizeKb: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/import-from-url`);
    return res.data;
  }

  /** Carga el catálogo de la tienda desde un circular que YA tiene productos (no
   *  re-extrae). Las imágenes se limpian en segundo plano: PNG sin fondo. */
  async loadCatalogFromCircular(circularId: string): Promise<{
    ok: boolean;
    productCount: number;
    upserted: number;
    modified: number;
    priceChanges: number;
    pendingImages: number;
    catalogTotal: number;
  }> {
    const res = await api.post(`/circulars/${circularId}/load-catalog`);
    return res.data;
  }

  /** 🔍 Overview con filtro por slug o búsqueda por nombre/dirección (q) */
  async getOverview(params?: { slug?: string; q?: string }): Promise<OverviewResponse> {
    const res = await api.get('/circulars/status/overview', { params });
    return res.data;
  }

  async getByStore(storeSlug: string): Promise<{ storeSlug: string; items: Circular[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}`);
    return res.data;
  }

  /** Catálogo persistente de la tienda (StoreProduct), sólo los visibles en RCS. */
  async getStoreCatalog(
    storeSlug: string
  ): Promise<{ storeSlug: string; count: number; items: any[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog`, {
      params: { visible: 'true' },
    });
    return res.data;
  }

  /** Catálogo COMPLETO para administración (incluye ocultos y sin oferta). */
  async getCatalogAdmin(
    storeSlug: string
  ): Promise<{ storeSlug: string; count: number; items: StoreProduct[]; cleaning?: boolean }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog`);
    return res.data;
  }

  /** Categorías de ESA tienda (las que ya usa + la lista base) para el selector del panel. */
  async getStoreCategories(storeSlug: string): Promise<string[]> {
    const res = await api.get(`/circulars/store/${storeSlug}/categories`);
    return res.data?.categories || [];
  }

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
  }

  /** Persists positions through the existing product endpoint and verifies both catalog views. */
  async saveCatalogOrder(storeSlug: string, productIds: string[]) {
    const current = await this.getCatalogAdmin(storeSlug);
    const products = new Map(current.items.map((item) => [item._id, item]));
    if (new Set(productIds).size !== productIds.length ||
        productIds.length !== products.size || productIds.some((id) => !products.has(id))) {
      throw new Error('El catálogo cambió. Recargá los productos y volvé a ordenarlos.');
    }

    // Sequential writes stop on failure. The caller reloads the server state if a partial save occurs.
    for (const [position, id] of productIds.entries()) {
      if (products.get(id)?.position === position) continue;
      const result = await this.updateStoreProduct(id, { position });
      if (!result.ok || result.item?.position !== position) {
        throw new Error('El backend no confirmó la posición del producto. No se pudo completar el orden.');
      }
    }

    const saved = await this.getCatalogAdmin(storeSlug);
    const savedPositions = new Map(saved.items.map((item) => [item._id, item.position]));
    if (productIds.some((id, position) => savedPositions.get(id) !== position)) {
      throw new Error('No se pudo verificar el orden guardado. Volvé a intentarlo.');
    }

    // The shopping-list app consumes this endpoint directly, so its response must preserve the order.
    const visible = await this.getStoreCatalog(storeSlug);
    const requestedPositions = new Map(productIds.map((id, position) => [id, position]));
    const returnedPositions = visible.items
      .filter((item) => requestedPositions.has(item._id))
      .map((item) => requestedPositions.get(item._id)!);
    if (returnedPositions.some((position, index) => index > 0 && position < returnedPositions[index - 1])) {
      throw new Error('Las posiciones se guardaron, pero la API de listas todavía no devuelve los productos en ese orden.');
    }
    return saved;
  }

  /** Deja visibles en el Pre-RCS SOLO los productos del último circular; oculta el resto. */
  async syncVisibility(storeSlug: string): Promise<{
    ok: boolean;
    circularTitle: string;
    inCircular: number;
    shown: number;
    hidden: number;
  }> {
    const res = await api.post(`/circulars/store/${storeSlug}/sync-visibility`);
    return res.data;
  }

  /** Limpia con IA los recortes crudos del catálogo (y genera los sin foto). Background. */
  async cleanCatalogImages(storeSlug: string): Promise<{ ok: boolean; queued: number; pending: number; verifying?: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/clean-images`);
    return res.data;
  }

  /** Imagen IA del producto: sin fondo, webp liviano, último gpt-image. ~10 s. */
  async aiProductImage(name: string, category?: string, instructions?: string): Promise<{ imageUrl: string }> {
    const res = await api.post('/ai/product-image', { name, category, instructions });
    return res.data;
  }

  /** Limpia con IA una imagen existente (captura pegada, recorte del flyer): deja SOLO el
   *  producto, sin precio ni texto, sin fondo, en HD y webp liviano. `box` (% 0–100)
   *  recorta antes esa zona de la imagen (el circular). ~30–60 s. */
  async aiCleanProductImage(
    imageUrl: string,
    name?: string,
    box?: { x: number; y: number; w: number; h: number },
    instructions?: string
  ): Promise<{ imageUrl: string }> {
    const res = await api.post('/ai/product-image-edit', { imageUrl, name, box, instructions }, { timeout: 180_000 });
    return res.data;
  }

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
  }

  /** Elimina un producto del catálogo. */
  async deleteStoreProduct(id: string): Promise<{ ok: boolean }> {
    const res = await api.delete(`/circulars/store-product/${id}`);
    return res.data;
  }

  /** Banners de campaña del Pre-RCS: el vigente (o null) + histórico, más nuevo primero. */
  async getStoreBanners(storeSlug: string): Promise<{ active: StoreBanner | null; items: StoreBanner[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/banners`);
    return res.data;
  }

  /** Fechas como "YYYY-MM-DD" (día completo, hora del Este). */
  async saveStoreBanner(
    storeSlug: string,
    body: { imageUrl: string; title?: string; startDate: string; endDate: string },
    id?: string
  ): Promise<{ ok: boolean; item: StoreBanner }> {
    const res = id
      ? await api.patch(`/circulars/store-banner/${id}`, body)
      : await api.post(`/circulars/store/${storeSlug}/banners`, body);
    return res.data;
  }

  /** La IA recorta el header del flyer y lo deja como banner con la vigencia del circular.
   *  `sourceUrl` = arte de campaña; sin él usa el archivo del circular vigente. ~20 s. */
  async bannerFromFlyer(storeSlug: string, sourceUrl?: string): Promise<{ ok: boolean; item: StoreBanner }> {
    const res = await api.post(`/circulars/store/${storeSlug}/banners/from-flyer`, sourceUrl ? { sourceUrl } : {}, { timeout: 120_000 });
    return res.data;
  }

  async deleteStoreBanner(id: string): Promise<{ ok: boolean }> {
    const res = await api.delete(`/circulars/store-banner/${id}`);
    return res.data;
  }

  async getAlerts(hours = 48) {
    const res = await api.get('/circulars/alerts', { params: { hours } });
    return res.data;
  }

  async getProducts(circularId: string): Promise<{ products: any[]; headline: string }> {
    const res = await api.get(`/circulars/${circularId}/products`);
    return res.data;
  }

  /** Save edited products, headline, and AI recipes to a circular */
  async saveProducts(circularId: string, products: any[], headline?: string, recipes?: any[]): Promise<any> {
    const res = await api.put(`/circulars/${circularId}/products`, { products, headline, recipes });
    return res.data;
  }

  /** Generate MMS barcodes for all customers of a store */
  async generateMms(circularId: string, storeSlug: string, campaignCode: string): Promise<{ generated: number; skipped: number }> {
    const res = await api.post('/mms-generator/generate', { circularId, storeSlug, campaignCode });
    return res.data;
  }
}

/** Helpers para filename -> slug/título */
export function inferStoreSlugFromFilename(fileName: string): string | null {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const norm = base
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  const slug = norm
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length ? slug : null;
}

export function inferTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

export const circularService = new CircularService();
