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
  periods: number; // periods efectivos usados (0 si no aplica)
  totalStores: number; // tiendas activas consideradas
  counts: MembershipCounts; // conteo por tipo
  unitFees: MembershipUnitFees; // fee unitario por tipo
  perTypeSubtotal: MembershipPerTypeSubtotal; // suma por tipo (unit * periods)
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
  };
  total: number; // campaigns.total + membership.subtotal
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
  unitFee: number; // fee unitario según membershipType
  periods: number; // periods efectivos aplicados
  subtotal: number; // unitFee * periods
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
  lastCampaignAudience: number | null; // tamaño audiencia última campaña enviada
  total: number; // campaigns.total + membership.subtotal
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
    grandTotal: number; // campaigns.total + membership
    optin: {
      cost: number; // costo total opt-in SMS
      count: number; // cantidad total opt-in SMS
      unitPrice: number; // precio unitario opt-in SMS
    };
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
        // importante para que NO lo trate como JSON
        'Content-Type': 'multipart/form-data',
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
