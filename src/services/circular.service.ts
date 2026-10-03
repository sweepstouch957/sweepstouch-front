// services/circulars.service.ts
import { api } from '@/libs/axios';

export interface ProductReviewItem {
  _id: string;
  key: string;
  name: string;
  page: number;
  kind: 'price' | 'name' | 'fineprint' | 'duplicate';
  confidence: number;
  current: Record<string, any>;
  proposed: Record<string, any>;
  evidence: string;
  status: 'open' | 'auto' | 'applied' | 'ignored';
  appliedAt?: string | null;
  createdAt: string;
}

export interface ProductReviewRun {
  _id: string;
  trigger: 'cron' | 'manual';
  startedAt: string;
  finishedAt: string | null;
  error: string;
  circulars: Array<{ id: string; title: string; pages: number; products: number; fromCampaign: boolean }>;
  pagesChecked: number;
  productsChecked: number;
  autoApplied: number;
  open: number;
  visibility: { applied: number; shown: number; hidden: number; flyers: string } | null;
  duplicates: number;
  missingPhotos: number;
}

export interface ProductReviewState {
  ok: boolean;
  run: ProductReviewRun | null;
  open: ProductReviewItem[];
  recent: ProductReviewItem[];
  autoConfidence: number;
}

export type CircularStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';

export interface Circular {
  _id: string;
  store: string; // ObjectId
  storeSlug: string;
  title: string;
  /** "campaign" = lo creó el import automático de una campaña (es un FLYER, no un circular). */
  fileKey: string;
  campaign?: string | null;
  /** Circular subido por páginas sueltas (PDF por página), en orden. */
  files?: Array<{ key: string; url: string; name?: string }>;
  fileUrl: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: CircularStatus;
  expiringSoon?: boolean;
  createdAt: string;
  updatedAt: string;
  previewImageUrl?: string;
  headline?: string;
  /** Sólo en la lista resumida (getByStoreSummary): cantidad sin traer los productos. */
  productCount?: number;
  /** Sólo en el detalle (getCircular) o la lista completa. */
  products?: any[];
  /** Auditoría por página (agentes de revisión): % de datos correctos y correcciones. */
  pageAudits?: PageAudit[];
}

export type StoreProfile = { storeSlug: string; rules: string; departments: string[]; learnedAt?: string };
export type AgentStep = { agent: string; status: 'running' | 'done' | 'error'; message: string; at: string };
export type Pipeline = {
  ok: boolean;
  agents: Record<string, { name: string; emoji: string; role: string }>;
  steps: AgentStep[];
  running: boolean;
  accuracy: number | null;
};

export interface PageAudit {
  page: number;
  products: number;
  checked: number;
  matched: number;
  fixed: number;
  imageMismatches: number;
  lowConfidence: number;
  accuracy: number;
  at: string;
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
  /** Departamento del circular con las palabras de la tienda (MEAT, PRODUCE…). */
  department?: string;
  unit?: string;
  imageUrl?: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  offerCondition?: string;
  /** Compra forzada: "15 LB BOX ONLY" con precio por libra. 0 = se vende suelto. */
  packQty?: number;
  packUnit?: string;
  /** Se despacha en el mostrador: no se puede pedir ni pagar online. */
  counterOnly?: boolean;
  /** Oferta compartida con otros productos ("A OR B 10/$10"). */
  offerGroup?: string;
  stock?: number | null;
  maxPerCustomer?: number | null;
  onPromotion?: boolean;
  hasOffer?: boolean;
  visibleInRcs?: boolean;
  /** De dónde entró: arte de campaña, circular o cargado a mano. */
  source?: 'flyer' | 'circular' | 'manual' | '';
  position?: number;
  updatedAt?: string;
  /** Viene de un flyer que todavía no empezó: rige desde esta fecha, no hoy. */
  effectiveFrom?: string;
  effectiveKind?: 'new' | 'price';
  /** Precio que va a regir desde `effectiveFrom` (el de hoy sigue en `price`). */
  effectivePrice?: string;
  effectiveCircularTitle?: string;
  /** Precio (y si es alta, el producto entero) esperando su fecha. Lo vuelca el cron. */
  pending?: StorePendingPrice | null;
}

export interface StorePendingPrice {
  from: string;
  circularId?: string | null;
  /** Alta: el producto está oculto hasta `from`. */
  isNew?: boolean;
  price?: string;
  originalPrice?: string;
  savings?: string;
  packQty?: number;
  packUnit?: string;
}

/** Productos que salen en una fecha, agrupados por día + circular/campaña de origen. */
export interface UpcomingGroup {
  key: string;
  /** YYYY-MM-DD en hora de las tiendas (Este de EE. UU.). */
  day: string;
  from: string;
  circular: {
    _id: string;
    title: string;
    fromCampaign: boolean;
    status: string;
    /** Imagen para recortar; vacío si es PDF (se pide la portada con getPreviewImage). */
    flyerUrl: string;
    hasFile: boolean;
  } | null;
  items: StoreProduct[];
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

/** circular-service CampaignImportJob: productos del arte de una campaña → lista de la tienda. */
export interface CampaignImportJob {
  _id: string;
  campaign: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  attempts: number;
  error?: string;
  startDate: string;
  result?: {
    circularId?: string | null;
    createdCircular?: boolean;
    found: number;
    added: number;
    effectiveFrom?: string | null;
    /** Banner sacado del arte, con la vigencia de la campaña (null = no se creó). */
    banner?: { id: string; imageUrl: string; startDate: string; endDate: string; fromArt: boolean } | null;
  };
  finishedAt?: string | null;
}

export interface UploadCircularPayload {
  file: File | Blob;
  storeSlug?: string;
  schedule?: 'current' | 'next';
  startDate?: string;
  endDate?: string;
  title?: string;
  overridePassword?: string;
  /** Hay un circular en esas fechas y el usuario confirmó sobrescribirlo (se borra el anterior). */
  override?: boolean;
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
    if (payload.override) form.append('override', '1');

    const res = await api.post('/circulars/upload', form);
    return res.data;
  }

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
    const created = (await api.post('/circulars/upload-pages', form)).data as { ok: boolean; circular: Circular; files: number };
    onProgress?.(1, payload.files.length);
    let last = created;
    for (let i = 0; i < rest.length; i++) {
      last = await this.attachPages(created.circular._id, [rest[i]], { append: true });
      onProgress?.(i + 2, payload.files.length);
    }
    return { ...last, files: payload.files.length };
  }

  /** Archivos (páginas) de un circular existente: reemplaza, o agrega al final con `append`. */
  async attachPages(circularId: string, files: File[], opts?: { append?: boolean }): Promise<{ ok: boolean; circular: Circular; files: number }> {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await api.patch(`/circulars/${circularId}/pages${opts?.append ? '?append=1' : ''}`, form);
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
  }

  /** Segunda pasada: re-escanea el circular POR SECCIONES (para los productos chicos) y
   *  suma sólo los que todavía no tiene. No toca los existentes ni sus imágenes. */
  async addMissingProducts(circularId: string): Promise<{ ok: boolean; added: number; found: number; productCount: number }> {
    const res = await api.post(`/circulars/${circularId}/extract-products-add`, { merge: true });
    return res.data;
  }

  /** Productos que todavía no salen (precio en `pending`), agrupados por día y origen. */
  async getUpcoming(
    storeSlug: string
  ): Promise<{ total: number; groups: UpcomingGroup[]; banners: (StoreBanner & { day: string })[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}/upcoming`);
    return { total: res.data?.total ?? 0, groups: res.data?.groups ?? [], banners: res.data?.banners ?? [] };
  }

  /** Corrige el precio que VA a salir (no el de hoy) o mueve su fecha. */
  async updatePending(
    id: string,
    patch: Partial<Pick<StorePendingPrice, 'price' | 'originalPrice' | 'savings' | 'packQty' | 'packUnit' | 'from'>>
  ): Promise<StoreProduct> {
    const res = await api.patch(`/circulars/store-product/${id}/pending`, patch);
    return res.data.item;
  }

  /** Publica ya un producto que esperaba su fecha. */
  async publishPendingNow(id: string): Promise<{ applied: number }> {
    const res = await api.post(`/circulars/store-product/${id}/pending/apply`);
    return res.data;
  }

  /** Publica ya un grupo entero (un día y/o un circular). Con `day`, adelanta también el
   *  banner automático de ese día. */
  async publishUpcomingNow(
    storeSlug: string,
    scope: { day?: string; circularId?: string }
  ): Promise<{ applied: number; bannersMoved?: number }> {
    const res = await api.post(`/circulars/store/${storeSlug}/upcoming/apply`, scope);
    return res.data;
  }

  /** Que no salga: un alta se borra, un cambio de precio se descarta (queda el de hoy). */
  async cancelPending(id: string): Promise<{ removed: boolean }> {
    const res = await api.delete(`/circulars/store-product/${id}/pending`);
    return res.data;
  }

  /** Estado del import automático de productos de una campaña (se encola al agendarla). */
  async getCampaignImport(campaignId: string): Promise<CampaignImportJob | null> {
    const res = await api.get(`/circulars/campaign-import/campaign/${campaignId}`);
    return res.data?.job ?? null;
  }

  /** Reintenta el import automático (p. ej. tras un fallo). Idempotente en el servidor. */
  async retryCampaignImport(input: {
    campaignId: string;
    storeId: string;
    imageUrl: string;
    startDate: string | Date;
    title?: string;
  }): Promise<CampaignImportJob> {
    const res = await api.post('/circulars/campaign-import', { ...input, force: true });
    return res.data.job;
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

  /** Lista liviana para el panel: sin productos ni recetas, con `productCount`. */
  async getByStoreSummary(storeSlug: string): Promise<{ storeSlug: string; items: Circular[] }> {
    const res = await api.get(`/circulars/store/${storeSlug}`, { params: { summary: 1 } });
    return res.data;
  }

  /** Un circular completo (con productos): lo que necesita el mensaje de prueba. */
  async getCircular(id: string): Promise<Circular> {
    const res = await api.get(`/circulars/by-id/${id}`);
    return res.data.circular;
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
  /** Catálogo del panel, paginado y buscable en el servidor (`limit` + `page` + `q`). */
  async getCatalogAdmin(
    storeSlug: string,
    opts?: { page?: number; limit?: number; q?: string }
  ): Promise<{ storeSlug: string; count: number; items: StoreProduct[]; cleaning?: boolean; total?: number; page?: number; pages?: number; limit?: number }> {
    const res = await api.get(`/circulars/store/${storeSlug}/catalog`, {
      params: { ...(opts?.limit ? { limit: opts.limit, page: opts.page || 1 } : {}), ...(opts?.q?.trim() ? { q: opts.q.trim() } : {}) },
    });
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

  /** Orden del catálogo: una sola llamada; `offset` = inicio de la página (catálogo paginado). */
  async saveCatalogOrder(storeSlug: string, productIds: string[], offset = 0) {
    if (new Set(productIds).size !== productIds.length) throw new Error('Ids repetidos en el orden.');
    const res = await api.patch('/circulars/store-product/reorder', { ids: productIds, offset });
    if (!res.data?.ok) throw new Error('El backend no confirmó el orden.');
    return res.data;
  }

  /* ── Perfil de la tienda: reglas fijas para la IA + departamentos aprendidos ── */
  async getStoreProfile(storeSlug: string): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.get(`/circulars/store/${storeSlug}/profile`);
    return res.data;
  }
  async saveStoreRules(storeSlug: string, rules: string): Promise<{ ok: boolean; profile: StoreProfile }> {
    const res = await api.put(`/circulars/store/${storeSlug}/profile`, { rules });
    return res.data;
  }

  /* ── Bitácora de los agentes del circular ── */
  async getPipeline(circularId: string): Promise<Pipeline> {
    const res = await api.get(`/circulars/${circularId}/pipeline`);
    return res.data;
  }

  /* ── Auditoría por página (agentes de revisión) ── */
  async getAudit(circularId: string): Promise<{ ok: boolean; running: boolean; accuracy: number | null; pages: PageAudit[] }> {
    const res = await api.get(`/circulars/${circularId}/audit`);
    return res.data;
  }
  async runAudit(circularId: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/${circularId}/audit`, {});
    return res.data;
  }

  /* ── Completar marca / tamaño releyendo el flyer o el circular ── */
  async fillDetails(storeSlug: string, source: 'flyer' | 'circular'): Promise<{ ok: boolean; job: DetailsJob }> {
    const res = await api.post(`/circulars/catalog/store/${storeSlug}/fill-details`, { source });
    return res.data;
  }
  async fillDetailsStatus(storeSlug: string): Promise<{ ok: boolean; job: DetailsJob | null }> {
    const res = await api.get(`/circulars/catalog/store/${storeSlug}/fill-details`);
    return res.data;
  }

  /* ── Revisión IA de productos (circular-service /review) ── */
  async getProductReview(storeSlug: string): Promise<ProductReviewState> {
    const res = await api.get(`/circulars/review/store/${storeSlug}`);
    return res.data;
  }
  async runProductReview(storeSlug: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/store/${storeSlug}/run`, {});
    return res.data;
  }
  async applySafeReviews(storeSlug: string): Promise<{ ok: boolean; applied: number }> {
    const res = await api.post(`/circulars/review/store/${storeSlug}/apply-safe`, {});
    return res.data;
  }
  async applyReview(id: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/${id}/apply`, {});
    return res.data;
  }
  async ignoreReview(id: string): Promise<{ ok: boolean }> {
    const res = await api.post(`/circulars/review/${id}/ignore`, {});
    return res.data;
  }

  /** "Arreglar productos de la lista": vuelca los precios que ya llegaron a su fecha y deja
   *  visibles en el Pre-RCS SOLO los productos del flyer VIGENTE (el que cubre hoy); oculta el
   *  resto. Sin flyer vigente (`circularId` null) oculta lo que vino de un flyer vencido. */
  async syncVisibility(storeSlug: string, only?: 'flyer' | 'circular'): Promise<{
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
    const res = await api.post(`/circulars/store/${storeSlug}/sync-visibility`, null, { params: only ? { only } : {} });
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
  /** Borra TODOS los productos del catálogo de la tienda (y, opcionalmente, vacía los circulares vivos para re-extraer). */
  async clearCatalog(storeSlug: string, opts?: { circulars?: boolean }): Promise<{ ok: boolean; deleted: number; circulars: number }> {
    const res = await api.delete(`/circulars/store/${storeSlug}/catalog${opts?.circulars ? '?circulars=1' : ''}`);
    return res.data;
  }

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

export type DetailsJob = {
  source: 'flyer' | 'circular';
  startedAt: string;
  finishedAt: string | null;
  total: number;
  done: number;
  updated: number;
  circularTitle: string;
  error: string;
};

export const circularService = new CircularService();
