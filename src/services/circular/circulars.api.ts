/** Circulares: subir, agendar, leer, vista general y MMS. */
import { api } from '@/libs/axios';
import type {
  Circular,
  OverviewResponse,
  ReschedulePayload,
  ScheduleCircularPayload,
  UploadCircularPayload,
} from './types';

export const circularsApi = {
  async upload(payload: UploadCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', payload.file);
    if (payload.storeSlug) form.append('storeSlug', payload.storeSlug);
    if (payload.schedule) form.append('schedule', payload.schedule);
    if (payload.startDate) form.append('startDate', payload.startDate);
    if (payload.endDate) form.append('endDate', payload.endDate);
    if (payload.title) form.append('title', payload.title);
    if (payload.overridePassword) form.append('overridePassword', payload.overridePassword);
    if (payload.override) form.append('override', '1');

    const res = await api.post('/circulars/upload', form);
    return res.data;
  },

  /** Circular en varios archivos (página 1, página 2… en alta): quedan como un solo circular
   *  en ese orden. Va UN archivo por request (el proxy corta a 52 MB y cada página pesa 8–10 MB):
   *  el primero crea el circular, los demás se agregan. `onProgress(i, total)` por archivo. */
  async uploadPages(
    payload: Omit<UploadCircularPayload, 'file'> & { files: File[] },
    onProgress?: (done: number, total: number) => void
  ): Promise<{ ok: boolean; circular: Circular; files: number }> {
    const [first, ...rest] = payload.files;
    const form = new FormData();
    form.append('files', first);
    if (payload.storeSlug) form.append('storeSlug', payload.storeSlug);
    if (payload.schedule) form.append('schedule', payload.schedule);
    if (payload.startDate) form.append('startDate', payload.startDate);
    if (payload.endDate) form.append('endDate', payload.endDate);
    if (payload.title) form.append('title', payload.title);
    if (payload.overridePassword) form.append('overridePassword', payload.overridePassword);
    if (payload.override) form.append('override', '1');
    const created = (await api.post('/circulars/upload-pages', form)).data as {
      ok: boolean;
      circular: Circular;
      files: number;
    };
    onProgress?.(1, payload.files.length);
    let last = created;
    for (let i = 0; i < rest.length; i++) {
      last = await circularsApi.attachPages(created.circular._id, [rest[i]], { append: true });
      onProgress?.(i + 2, payload.files.length);
    }
    return { ...last, files: payload.files.length };
  },

  /** Archivos (páginas) de un circular existente: reemplaza, o agrega al final con `append`. */
  async attachPages(
    circularId: string,
    files: File[],
    opts?: { append?: boolean }
  ): Promise<{ ok: boolean; circular: Circular; files: number }> {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await api.patch(
      `/circulars/${circularId}/pages${opts?.append ? '?append=1' : ''}`,
      form
    );
    return res.data;
  },

  async schedule(payload: ScheduleCircularPayload): Promise<{ ok: boolean; circular: Circular }> {
    const res = await api.post('/circulars/schedule', payload);
    return res.data;
  },

  /** Reprograma un circular existente (nuevas fechas o título) — backend: PUT /circulars/:id */
  async reschedule(payload: ReschedulePayload): Promise<{ ok: boolean; circular: Circular }> {
    const { circularId, ...body } = payload;
    const res = await api.put(`/circulars/${circularId}`, body);
    return res.data;
  },

  async attachFile(
    circularId: string,
    file: File | Blob
  ): Promise<{ ok: boolean; circular: Circular }> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.patch(`/circulars/${circularId}/attach`, form);
    return res.data;
  },

  /** `aiImages: false` = no limpiar las imágenes con IA ahora (es lo caro: una generación
   *  por producto). Quedan los recortes y se limpian después desde Productos. */
  /** `guidance` = indicaciones para la IA ("sólo productos Cherry Valley"); `referenceImages` =
   *  fotos de apoyo (una lista escrita a mano, por ejemplo). El guardado es incremental en el
   *  servidor: aunque la espera se corte, lo leído queda. */
  async extractProducts(
    circularId: string,
    maxProducts?: number,
    opts?: { aiImages?: boolean; guidance?: string; referenceImages?: string[] }
  ): Promise<any> {
    const res = await api.post(`/circulars/${circularId}/extract-products`, {
      maxProducts: maxProducts || 0,
      ...(opts?.aiImages === false ? { aiImages: false } : {}),
      ...(opts?.guidance?.trim() ? { guidance: opts.guidance.trim() } : {}),
      ...(opts?.referenceImages?.length ? { referenceImages: opts.referenceImages } : {}),
    });
    return res.data;
  },

  /** Segunda pasada: re-escanea el circular POR SECCIONES (para los productos chicos) y
   *  suma sólo los que todavía no tiene. No toca los existentes ni sus imágenes. */
  async addMissingProducts(
    circularId: string
  ): Promise<{ ok: boolean; added: number; found: number; productCount: number }> {
    const res = await api.post(`/circulars/${circularId}/extract-products-add`, { merge: true });
    return res.data;
  },

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
  },

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
  },

  /** Imagen de la primera página del circular (los PDF se renderizan una vez y se cachea). */
  async getPreviewImage(circularId: string): Promise<{ ok: boolean; url: string }> {
    const res = await api.get(`/circulars/${circularId}/preview-image`);
    return res.data;
  },

  /** Sin circular vigente: baja el PDF de la semana desde `store.circularssUrl`, lo
   *  guarda y crea el circular de la semana actual. La extracción se dispara aparte. */
  async importFromStoreUrl(
    storeSlug: string
  ): Promise<{ ok: boolean; circular: Circular; fileType: string; sizeKb: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/import-from-url`);
    return res.data;
  },

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
  },

  /** 🔍 Overview con filtro por slug o búsqueda por nombre/dirección (q) */
  async getOverview(params?: { slug?: string; q?: string }): Promise<OverviewResponse> {
    const res = await api.get('/circulars/status/overview', { params });
    return res.data;
  },

  /** Lista liviana para el panel: sin productos ni recetas, con `productCount`. */
  async getByStoreSummary(storeSlug: string): Promise<{ storeSlug: string; items: Circular[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}`, { params: { summary: 1 } });
    return res.data;
  },

  /** Un circular completo (con productos): lo que necesita el mensaje de prueba. */
  async getCircular(id: string): Promise<Circular> {
    const res = await api.get(`/circulars/by-id/${id}`);
    return res.data.circular;
  },

  async getByStore(storeSlug: string): Promise<{ storeSlug: string; items: Circular[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}`);
    return res.data;
  },

  async getAlerts(hours = 48) {
    const res = await api.get('/circulars/alerts', { params: { hours } });
    return res.data;
  },

  async getProducts(circularId: string): Promise<{ products: any[]; headline: string }> {
    const res = await api.get(`/circulars/${circularId}/products`);
    return res.data;
  },

  /** Save edited products, headline, and AI recipes to a circular */
  async saveProducts(
    circularId: string,
    products: any[],
    headline?: string,
    recipes?: any[]
  ): Promise<any> {
    const res = await api.put(`/circulars/${circularId}/products`, { products, headline, recipes });
    return res.data;
  },

  /** Generate MMS barcodes for all customers of a store */
  async generateMms(
    circularId: string,
    storeSlug: string,
    campaignCode: string
  ): Promise<{ generated: number; skipped: number }> {
    const res = await api.post('/mms-generator/generate', { circularId, storeSlug, campaignCode });
    return res.data;
  },
};
