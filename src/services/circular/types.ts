/** Tipos del dominio circular / catálogo / listas. Única fuente: el resto importa de acá. */
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
  circulars: Array<{
    id: string;
    title: string;
    pages: number;
    products: number;
    fromCampaign: boolean;
  }>;
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

export type RescanJob = {
  mode: 'missing' | 'all' | 'ids';
  startedAt: string;
  finishedAt: string | null;
  total: number;
  done: number;
  relocated: number;
  generated: number;
  failed: number;
  error: string;
};
export type StoreLesson = { text: string; agent: string; source: 'manual' | 'auto'; at: string };
export type StoreProfile = {
  storeSlug: string;
  rules: string;
  departments: string[];
  lessons?: StoreLesson[];
  learnedAt?: string;
};
export type ParsedListProduct = {
  name: string;
  brand: string;
  size: string;
  presentation: string;
  price: string;
  originalPrice: string;
  unit: string;
  counterOnly: boolean;
  limitPerFamily: number;
  savings: string;
  category: string;
};
export type CatalogSource = {
  id: string;
  title: string;
  kind: 'flyer' | 'circular';
  /** past = venció hace poco (hasta 3 días): se puede elegir y se reabre hasta hoy. */
  when: 'live' | 'next' | 'past';
  startDate: string;
  endDate: string;
  /** Productos del catálogo que lo tienen como origen. */
  count: number;
  /** Productos leídos en ese flyer/circular. */
  products: number;
  hasFile: boolean;
};
export type CatalogCleanupPlan = {
  ok: boolean;
  scanned: number;
  wouldChange: number;
  counts: {
    saleUnit: number;
    offerCondition: number;
    maxPerCustomer: number;
    minPerCustomer: number;
    name: number;
    counterOnly: number;
    price: number;
    originalPrice: number;
  };
  examples: Array<{ name: string; changes: Record<string, unknown> }>;
  modified?: number;
};
export type CatalogSummary = {
  ok: boolean;
  total: number;
  visible: number;
  hidden: number;
  /** Esperan su fecha (precio o alta de un flyer futuro). */
  pending: number;
  /** Visibles sin foto. */
  noImage: number;
  bySource: { flyer: number; circular: number; manual: number };
  /** Lo que rige hoy en la lista del cliente (flyer de campaña gana al circular semanal). */
  ruling: {
    id: string;
    title: string;
    kind: 'flyer' | 'circular';
    startDate: string;
    endDate: string;
    hasFile: boolean;
    /** Productos que trae ese circular, cuántos son distintos y cuántos son lecturas repetidas. */
    products: number;
    uniqueProducts: number;
    duplicates: number;
  } | null;
};
export type AgentStep = {
  agent: string;
  status: 'running' | 'done' | 'error';
  message: string;
  at: string;
};
export type Pipeline = {
  ok: boolean;
  agents: Record<string, { name: string; emoji: string; role: string }>;
  steps: AgentStep[];
  running: boolean;
  accuracy: number | null;
  verification?: AuditVerification | null;
};

/** Veredicto final de Vanessa: tras corregir, vuelve a leer el flyer y dice qué % coincide. */
export interface AuditVerification {
  accuracy: number;
  checked: number;
  matched: number;
  pages: number;
  mismatches: string[];
  at: string;
}

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
  /** Lo trajo un flyer/circular y falta validarlo y publicarlo (Revisar y publicar). */
  pendingReview?: boolean;
  _id: string;
  storeSlug: string;
  name: string;
  brand?: string;
  size?: string;
  /** Entero / en piezas / bandeja 2 lb… lo que la IA suele leer mal. */
  presentation?: string;
  /** Unidad de venta: lb, kg, unidad, paquete. */
  saleUnit?: string;
  /** Otros nombres con que la IA lee este producto; resuelven a esta ficha. */
  aliases?: string[];
  /** Campos corregidos a mano: las relecturas no los pisan. */
  manualFields?: string[];
  /** La unidad se supuso (carne/marisco sin "LB" impreso). */
  unitAssumed?: boolean;
  circularId?: string | null;
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
    /** Aprobado por adelantado: sus productos salen solos en su fecha. */
    reviewApprovedAt?: string | null;
    reviewApprovedBy?: string;
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
  title?: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  attempts: number;
  error?: string;
  /** Cuándo vuelve a intentarlo (cuota de la IA agotada: espera lo que pide el proveedor). */
  runAfter?: string;
  createdAt?: string;
  startDate: string;
  result?: {
    circularId?: string | null;
    createdCircular?: boolean;
    found: number;
    added: number;
    effectiveFrom?: string | null;
    /** Banner sacado del arte, con la vigencia de la campaña (null = no se creó). */
    banner?: {
      id: string;
      imageUrl: string;
      startDate: string;
      endDate: string;
      fromArt: boolean;
    } | null;
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

/** Precio regular de un producto en un supermercado de la zona. */
export type RegularPriceQuote = {
  price: number;
  unit?: string;
  store: string;
  note?: string;
  /** Precio habitual de la cadena en la región, no publicado para ese zip. */
  estimated?: boolean;
};

export type RegularPrices = {
  zip: string;
  quotes: RegularPriceQuote[];
  fetchedAt?: string;
  cached: boolean;
};
