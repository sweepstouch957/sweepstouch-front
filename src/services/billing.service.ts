// sweepstouch-front/src/services/billing.service.ts

import { api } from '@/libs/axios';
import type { AxiosResponse } from 'axios';
import type { CampaignLog, MessageLogStatus } from './campaing.service';

/* ========================= Tipos compartidos ========================= */

export type MembershipType = 'mensual' | 'semanal' | 'especial' | 'none' | 'all';
export type PaymentMethod = 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';

export interface CampaignTotals {
  sms: number;
  mms: number;
  total: number;
  /** Audiencia sumada de todas las campañas del rango. */
  audience?: number;
  /** Cuántas campañas entraron en la suma. */
  count?: number;
}

/* ========================= /billing/range ========================= */

export interface RangeBillingParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Multiplicador de membresía (entero, opcional). Ej: 4 */
  periods?: number;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

/* ---------- Bulk import payments ---------- */

export interface BulkPaymentRow {
  storeId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  method?: StorePaymentMethod;
  reference?: string;
  notes?: string;

  /** Opcionales para email/metadata */
  paidAt?: string; // ISO / YYYY-MM-DD
  periodLabel?: string; // ej: "12/2025"
}

export interface BulkImportPaymentsResponse {
  ok: boolean;
  inserted: number;
  invoicesUpdated: number;
  invoiceUpdates: Array<{ invoiceId: string; status: InvoiceStatus }>;
  emails: Array<{
    storeId: string;
    sent: boolean;
    template?: 'payment-thanks' | 'payment-reminder';
    pending?: string;
    reason?: string;
  }>;
}


export interface MembershipPerTypeSubtotal {
  mensual: number;
  semanal: number;
  especial: number;
}

export interface MembershipUnitFees {
  mensual: number;
  semanal: number;
  especial: number;
}

export interface MembershipCounts {
  mensual: number;
  semanal: number;
  especial: number;
  other: number;
}

export interface MembershipMeta {
  periods: number; // ya no se usa: la membresía la factura QuickBooks
  totalStores: number; // tiendas activas consideradas
  counts: MembershipCounts; // conteo por tipo
  unitFees: MembershipUnitFees; // fee unitario de referencia por tipo
  perTypeSubtotal: MembershipPerTypeSubtotal; // facturado en QuickBooks por tipo
  /** De dónde salió el importe: 'quickbooks' o 'no-disponible' si la API falló. */
  source?: 'quickbooks' | 'no-disponible';
  qboError?: string | null;
  /** Alta de comercio facturada en el rango. */
  setupSubtotal?: number;
  /** Membresía facturada a clientes de QuickBooks sin tienda activa vinculada. */
  unlinkedMembership?: number;
}

export interface RangeBillingResponse {
  ok: boolean;
  range: {
    start: string; // ISO
    end: string; // ISO
    paymentMethod: PaymentMethod | null;
    membershipType: MembershipType | null;
  };
  breakdown: {
    campaigns: CampaignTotals;
    membership: MembershipMeta & { subtotal: number }; // subtotal membresía
    optin: {
      cost: number; // costo total opt-in SMS
      count: number; // cantidad total opt-in SMS
      unitPrice: number; // precio unitario opt-in SMS
    };
    extras?: QboExtras;
    /** Todo lo facturado en QuickBooks en el rango y su diferencia contra el total calculado. */
    qbo?: QboRangeTotals | null;
  };
  total: number; // campaigns + membership + optin + extras.total
}

/** Lo que solo existe en QuickBooks y entra al Grand Total leído de ahí. */
export interface QboExtras {
  /** Merchant Set-Up de tiendas vinculadas. */
  setup: number;
  /** Promotional Items, Flyers, Design Fee, sin categoría no identificada… */
  otros: number;
  services: number;
  /** Facturado a clientes QBO sin tienda vinculada. */
  unlinked: number;
  /** false con filtro de tiendas: esos clientes quedan fuera del total. */
  unlinkedIncluded: boolean;
  total: number;
}

export interface QboRangeTotals {
  billedTotal: number;
  /** Cargos cuyo producto no se reconoce (antes se calculaban y se tiraban). */
  otros: number;
  setup: number;
  invoices: number;
  /** billedTotal − total calculado. 0 = cuadra. */
  diff: number;
  /**
   * Monto ubicado en el rango solo por fecha de EMISIÓN: la línea no trae fecha
   * de servicio ni como dato ni en la descripción. Puede arrastrar cargos de
   * otro periodo (p. ej. campaña del 31/7 facturada el 3/8).
   */
  inferred?: number;
  inferredLines?: number;
  /** Desglose por item del catálogo del contador (Set-Up, Promotional Items, Flyers…). */
  items?: QboBilledItem[];
  /** El porqué del descuadre, en causas con nombre. Suma ≈ diff. */
  why?: QboDescuadreWhy | null;
}

export interface QboDescuadreWhy {
  /** Set-Up, Promotional Items, Flyers… servicios que el Grand Total del sistema no suma. */
  services: number;
  /** Campañas facturadas en QuickBooks − campañas registradas en el sistema. */
  campaignsDiff: number;
  /** Opt-in facturado en QuickBooks − opt-in calculado por participaciones. */
  optinDiff: number;
  /** Clientes de QuickBooks sin tienda vinculada o fuera del filtro. */
  unlinked: number;
  /** Qué tienda o cliente pone cada dólar de cada causa. */
  detail?: {
    services: Array<{ storeId: string; name: string; amount: number }>;
    campaigns: Array<{ storeId: string; name: string; qbo: number; system: number; diff: number }>;
    optin: Array<{ storeId: string; name: string; qbo: number; system: number; diff: number }>;
    unlinked: Array<{ qboCustomerId: string; name: string; total: number }>;
  };
}

export interface QboBilledItem {
  id: string;
  /** Padre del item en QuickBooks ("Campaign", "Membership", "Otros"…). */
  group: string;
  label: string;
  full: string;
  amount: number;
  lines: number;
  bucket?: 'membership' | 'setup' | 'optin' | 'campaigns' | 'otros';
  /** Solo en "Sin categoría": las líneas, para ver qué son. */
  detail?: Array<{
    customerName: string;
    docNumber: string;
    date: string;
    description: string;
    amount: number;
  }>;
}

/* ========================= /billing/stores-report ========================= */

export interface StoresReportParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  /** Multiplicador de membresía por tienda (entero, opcional). Ej: 3 */
  periods?: number;
  paymentMethod?: PaymentMethod;
  membershipType?: MembershipType;
}

export interface StoreMembershipBreakdown {
  unitFee: number; // fee unitario de referencia según membershipType
  periods: number; // siempre 0: la membresía ya no se multiplica
  subtotal: number; // lo que QuickBooks facturó de membresía en el rango
  windows?: number;
  /** Alta de comercio facturada en el rango. */
  setup?: number;
  source?: 'quickbooks' | 'no-disponible';
  /** false si la tienda no está vinculada a un cliente de QuickBooks. */
  linked?: boolean;
}
export interface ListStorePaymentsResponse {
  ok: boolean;
  payments: StorePayment[];
}

/* ---------- List invoice payments ---------- */

export interface ListInvoicePaymentsResponse {
  ok: boolean;
  invoiceId: string;
  totalPaid: number;
  count: number;
  payments: StorePayment[];
}
export interface StoreReportRow {
  storeId: string;
  name: string | null;
  membershipType: MembershipType | null;
  paymentMethod: PaymentMethod | null;
  campaigns: CampaignTotals; // por tienda en rango
  membership: StoreMembershipBreakdown;
  /** Audiencia sumada de todas las campañas del rango. */
  campaignsAudience?: number;
  campaignsCount?: number;
  lastCampaignAudience: number | null; // tamaño audiencia última campaña enviada
  total: number; // campaigns.total + membership.subtotal
  /** Descuadre contra QuickBooks; null si la tienda no está vinculada. */
  qbo?: { billedTotal: number; otros: number; invoices: number; diff: number; inferred?: number } | null;
}

export interface StoresReportResponse {
  ok: boolean;
  range: {
    start: string; // ISO
    end: string; // ISO
    periods: number; // periods efectivos usados
    paymentMethod: PaymentMethod | null;
    membershipType: MembershipType | null;
  };
  stores: StoreReportRow[];
  totals: {
    campaigns: CampaignTotals; // agregados globales
    membership: number; // suma de membership.subtotal
    membershipSource?: 'quickbooks' | 'no-disponible';
    grandTotal: number; // campaigns + membership + optin + extras.total
    optin: {
      cost: number; // costo total opt-in SMS
      count: number; // cantidad total opt-in SMS
      unitPrice: number; // precio unitario opt-in SMS
    };
    extras?: QboExtras;
    /** Facturado en QuickBooks en el rango (incluye clientes sin vincular) vs total calculado. */
    qbo?: QboRangeTotals | null;
  };
}

/* ========================= /tracking/campaigns/logs ========================= */

// Reutilizamos los tipos de logs de campaña, asumiendo que el backend los devuelve igual
export interface SmsLogsParams {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  status?: MessageLogStatus; // delivered, failed, queued
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  search?: string; // phone or sid
}

export interface SmsLogsResponse {
  ok: boolean;
  data: CampaignLog[]; // Lista de logs de SMS/MMS
  total: number; // Total de logs
  totalPages: number;
  page: number;
  limit: number;
}

/* ========================= Facturas & Pagos ========================= */

/** Tipos de ítems de factura (alineado con backend) */
export type InvoiceItemKind = 'campaign' | 'membership' | 'optin' | 'manual';

export interface InvoiceItem {
  kind: InvoiceItemKind;
  description?: string;
  amount: number;
  metadata?: any;
}

/** Estado de la factura (backend: open | partial | paid | cancelled) */
export type InvoiceStatus = 'open' | 'partial' | 'paid' | 'cancelled';

export interface StoreInvoice {
  _id: string;
  store: string;
  periodStart?: string;
  periodEnd?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  invoiceNumber?: string;
  fileKey?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;

  /** Campos calculados solo en /billing/stores/:storeId/balance */
  paid?: number;
  pending?: number;
}

export type StorePaymentMethod = 'cash' | 'wire' | 'transfer' | 'card' | 'check' | 'other';

export interface StorePayment {
  _id: string;
  store: string;
  invoice?: string;
  amount: number;
  currency: string;
  method: StorePaymentMethod;
  reference?: string;
  notes?: string;
  fileKey?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Create invoice (manual) ---------- */

export interface CreateInvoicePayload {
  periodStart?: string; // YYYY-MM-DD
  periodEnd?: string; // YYYY-MM-DD
  items?: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  currency?: string;
  invoiceNumber?: string;
}

export interface CreateInvoiceResponse {
  ok: boolean;
  invoice: StoreInvoice;
}

/* ---------- List store invoices ---------- */

export interface ListStoreInvoicesParams {
  status?: InvoiceStatus;
}

export interface ListStoreInvoicesResponse {
  ok: boolean;
  invoices: StoreInvoice[];
}

/* ---------- Register payment / abono ---------- */

export interface RegisterPaymentPayload {
  invoiceId?: string;
  amount: number;
  currency?: string;
  method?: StorePaymentMethod;
  reference?: string;
  notes?: string;
}

export interface RegisterPaymentResponse {
  ok: boolean;
  payment: StorePayment;
}

/* ---------- Store balance (detalle) ---------- */

export interface StoreBalance {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  maxDaysOverdue?: number;
}

export interface StoreBalanceResponse {
  ok: boolean;
  storeId: string;
  balance: StoreBalance;
  invoices: StoreInvoice[]; // con campos paid/pending
}

/* ---------- Stores balances (morosidad global) ---------- */

export interface StoreBalanceSummaryRow {
  store: string; // storeId
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

export interface StoresBalancesResponse {
  ok: boolean;
  stores: StoreBalanceSummaryRow[];
}

/* ---------- Generate invoices from range ---------- */

export interface GenerateInvoicesFromRangePayload {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  storeIds?: string[];
  periods?: number;
  includeCampaigns?: boolean;
  includeMembership?: boolean;
  includeOptin?: boolean;
}

export interface GeneratedInvoiceRef {
  storeId: string;
  invoiceId: string;
  total: number;
}

export interface SkippedInvoiceRef {
  storeId: string;
  reason: string;
}

export interface GenerateInvoicesFromRangeResponse {
  ok: boolean;
  range: {
    start: string; // ISO o YYYY-MM-DD, según backend
    end: string;
    // startDate/endDate pueden venir como ISO (opcional tipado laxo)
    startDate?: any;
    endDate?: any;
  };
  summary: {
    storesProcessed: number;
    invoicesCreated: number;
    storesSkipped: number;
  };
  created: GeneratedInvoiceRef[];
  skipped: SkippedInvoiceRef[];
}

/* ========================= Servicio ========================= */

export class BillingService {
  /** Global: campañas del rango + membresía × periods (si viene) */
  async getRangeBilling(params: RangeBillingParams): Promise<AxiosResponse<RangeBillingResponse>> {
    const cleanParams = {
      ...params,
      membershipType: params.membershipType === 'all' ? undefined : params.membershipType,
    };
    return api.get('/billing/range', { params: cleanParams });
  }

  /** Por tienda: campañas del rango + membresía × periods (si viene) */
  async getStoresRangeReport(
    params: StoresReportParams
  ): Promise<AxiosResponse<StoresReportResponse>> {
    const cleanParams = {
      ...params,
      membershipType: params.membershipType === 'all' ? undefined : params.membershipType,
    };
    return api.get('/billing/stores-report', { params: cleanParams });
  }

  /** Logs de SMS/MMS para un rango de fechas */
  async getSmsLogs(params: SmsLogsParams): Promise<AxiosResponse<SmsLogsResponse>> {
    // Limpiamos los parámetros undefined/null/empty-string para que no se envíen en la URL
    const cleanParams: Record<string, any> = {};
    if (params.start) cleanParams.start = params.start;
    if (params.end) cleanParams.end = params.end;
    if (params.status) cleanParams.status = params.status;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.sort) cleanParams.sort = params.sort;
    if (params.search) cleanParams.search = params.search;

    // La URL correcta es /tracking/campaigns/logs (endpoint global sin campaignId)
    return api.get('/tracking/campaigns/logs', { params: cleanParams });
  }

  /* ========================= Facturas ========================= */

  /**
   * Crea una factura para una tienda (manual o desde UI).
   * Si viene file, se manda como multipart/form-data.
   */
  async createStoreInvoice(
    storeId: string,
    payload: CreateInvoicePayload,
    file?: File
  ): Promise<AxiosResponse<CreateInvoiceResponse>> {
    const formData = new FormData();
    if (payload.periodStart) formData.append('periodStart', payload.periodStart);
    if (payload.periodEnd) formData.append('periodEnd', payload.periodEnd);
    if (payload.currency) formData.append('currency', payload.currency);
    if (payload.invoiceNumber) formData.append('invoiceNumber', payload.invoiceNumber);
    formData.append('subtotal', String(payload.subtotal));
    formData.append('tax', String(payload.tax ?? 0));
    formData.append('total', String(payload.total));

    if (payload.items && payload.items.length > 0) {
      // Enviamos items como JSON string (backend debe parsear)
      formData.append('items', JSON.stringify(payload.items));
    }

    if (file) {
      formData.append('file', file);
    }

    return api.post(`/billing/invoices/stores/${storeId}/invoices`, formData);
  }

  /**
   * Lista facturas de una tienda (puedes filtrar por status).
   */
  async listStoreInvoices(
    storeId: string,
    params?: ListStoreInvoicesParams
  ): Promise<AxiosResponse<ListStoreInvoicesResponse>> {
    return api.get(`/billing/invoices/stores/${storeId}/invoices`, { params });
  }

  /**
   * Registra un pago / abono para una tienda.
   * Si viene file, se manda como comprobante (multipart/form-data).
   */
  // sweepstouch-front/src/services/billing.service.ts

  async registerStorePayment(
    storeId: string,
    payload: RegisterPaymentPayload,
    file?: File
  ): Promise<AxiosResponse<RegisterPaymentResponse>> {
    const formData = new FormData();

    if (payload.invoiceId) formData.append('invoiceId', payload.invoiceId);
    formData.append('amount', String(payload.amount));
    if (payload.currency) formData.append('currency', payload.currency);
    if (payload.method) formData.append('method', payload.method);
    if (payload.reference) formData.append('reference', payload.reference);
    if (payload.notes) formData.append('notes', payload.notes);

    // 🔥 CLAVE: adjuntar realmente el archivo con el MISMO nombre que usa multer
    if (file) {
      formData.append('file', file); // <-- upload.single("file")
    }

    return api.post(`/billing/invoices/stores/${storeId}/payments`, formData, {
      headers: {
        // let axios auto-set Content-Type with correct boundary
        'Content-Type': undefined,
      },
    });
  }

  /**
   * Balance completo de una tienda:
   * - total facturado
   * - total pagado
   * - total pendiente
   * - facturas con paid/pending
   */
  async getStoreBalance(storeId: string): Promise<AxiosResponse<StoreBalanceResponse>> {
    return api.get(`/billing/invoices/stores/${storeId}/balance`);
  }

  /**
   * Resumen de morosidad de todas las tiendas.
   */
  async getStoresBalances(): Promise<AxiosResponse<StoresBalancesResponse>> {
    return api.get('/billing/invoices/stores-balances');
  }

  /**
   * Genera facturas para un rango específico (acción manual tipo "facturar mes completo").
   */
  async generateInvoicesFromRange(
    payload: GenerateInvoicesFromRangePayload
  ): Promise<AxiosResponse<GenerateInvoicesFromRangeResponse>> {
    return api.post('/billing/invoices/generate-invoices-from-range', payload);
  }

  /**
   * Lista TODOS los pagos de una tienda.
   */
  async listStorePayments(storeId: string): Promise<AxiosResponse<ListStorePaymentsResponse>> {
    return api.get(`/billing/invoices/stores/${storeId}/payments`);
  }

  /**
   * Lista TODOS los pagos asociados a una factura específica (invoiceId).
   */
  async listInvoicePayments(
    invoiceId: string
  ): Promise<AxiosResponse<ListInvoicePaymentsResponse>> {
    return api.get(`/billing/invoices/invoices/${invoiceId}/payments`);
  }

  async importPaymentsBulkJson(
    rows: BulkPaymentRow[]
  ): Promise<AxiosResponse<BulkImportPaymentsResponse>> {
    return api.post('/billing/invoices/payments/bulk-import', { rows });
  }

  async importPaymentsBulkExcel(
    file: File
  ): Promise<AxiosResponse<BulkImportPaymentsResponse>> {
    const formData = new FormData();
    formData.append('file', file); // multer upload.single("file")
    return api.post('/billing/payments/bulk-import', formData, {
      headers: { 'Content-Type': undefined },
    });
  }

  async importInvoicesBulkExcel(
    file: File,
    sendEmails = false
  ): Promise<AxiosResponse<BulkImportPaymentsResponse>> { // Assuming BulkImportPaymentsResponse for now, adjust if a specific BulkImportInvoicesResponse is defined
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sendEmails', String(sendEmails));
    return api.post('/billing/invoices/bulk-import', formData, {
      headers: { 'Content-Type': undefined },
    });
  }

  /**
   * Import manually resolved rows (from autocomplete matching).
   * Called after the initial bulk import returns notFound rows.
   */
  async importResolvedInvoices(
    resolvedRows: Array<{ storeId: string; openBalance: number; daysOverdue?: number }>,
    sendEmails = false
  ): Promise<AxiosResponse<{ ok: boolean; inserted: number; message: string }>> {
    return api.post('/billing/invoices/bulk-import/resolve', { resolvedRows, sendEmails });
  }

  /* ===== [DEPRECATED] Métodos anteriores (eliminados del backend) =====
   * Si los tenías usados en UI, cámbialos a getRangeBilling o getStoresRangeReport.
   */
  // async getWeeklyBilling() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getMonthlyBillingSummary() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getWeeklyRangeBilling() { throw new Error('Deprecated: use getRangeBilling'); }
  // async getMonthWeeklyBilling() { throw new Error('Deprecated: use getRangeBilling'); }
}

export const billingService = new BillingService();

/* ========================= Query Keys ========================= */

const norm = (v: unknown) => (v ?? 'all').toString();

export const billingQK = {
  /** Global */
  range: (p: RangeBillingParams) =>
    [
      'billing',
      'range',
      p.start,
      p.end,
      norm(p.periods ?? 0),
      norm(p.paymentMethod),
      norm(p.membershipType),
    ] as const,

  /** Por tienda */
  storesReport: (p: StoresReportParams) =>
    [
      'billing',
      'stores-report',
      p.start,
      p.end,
      norm(p.periods ?? 0),
      norm(p.paymentMethod),
      norm(p.membershipType),
    ] as const,

  /** Logs de SMS/MMS */
  smsLogs: (p: SmsLogsParams) =>
    [
      'billing',
      'campaigns', // Corregido el nombre del query key
      p.start,
      p.end,
      p.status,
      p.page,
      p.limit,
      p.sort,
      p.search,
    ] as const,

  /** Facturas de una tienda */
  storeInvoices: (storeId: string, status?: InvoiceStatus) =>
    ['billing', 'store-invoices', storeId, status ?? 'all'] as const,

  /** Balance de una tienda */
  storeBalance: (storeId: string) => ['billing', 'store-balance', storeId] as const,
  bulkImportPayments: () => ['billing', 'bulk-import-payments'] as const,
  /** Morosidad de todas las tiendas */
  storesBalances: () => ['billing', 'stores-balances'] as const,
  /** Pagos de una tienda */
  storePayments: (storeId: string) => ['billing', 'store-payments', storeId] as const,
  /** Pagos de una factura */
  invoicePayments: (invoiceId: string) => ['billing', 'invoice-payments', invoiceId] as const,

  /** Generación de facturas por rango (si quieres cachearlo) */
  generateInvoicesFromRange: (p: GenerateInvoicesFromRangePayload) =>
    [
      'billing',
      'generate-invoices-from-range',
      p.start,
      p.end,
      norm(p.periods ?? 0),
      (p.storeIds ?? []).join(',') || 'all',
      p.includeCampaigns ?? true,
      p.includeMembership ?? true,
      p.includeOptin ?? true,
    ] as const,
};
