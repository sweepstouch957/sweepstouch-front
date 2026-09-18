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
  async createFromImageUrl(storeSlug: string, imageUrl: string, title?: string): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/from-url', { storeSlug, imageUrl, title });
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
      >
    >
  ): Promise<{ ok: boolean; item: StoreProduct }> {
    const res = await api.patch(`/circulars/store-product/${id}`, patch);
    return res.data;
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
  async aiProductImage(name: string, category?: string): Promise<{ imageUrl: string }> {
    const res = await api.post('/ai/product-image', { name, category });
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
