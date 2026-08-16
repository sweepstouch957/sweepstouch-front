// sweepstouch-front/src/services/qbo.service.ts
//
// Cartera de QuickBooks Online. El contador factura ahí a mano desde hace años
// (Design Fee, Merchant Set-Up, Sweepstakes...), así que QBO tiene la deuda completa
// y Mongo solo la parte que genera el pipeline. Para "cuánto deben", manda QBO.

import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */

export interface QboAging {
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
}

export interface QboLastPayment {
  date: string; // YYYY-MM-DD
  amount: number;
  qboId: string;
}

export interface QboBalanceRow {
  qboCustomerId: string;
  qboName: string;

  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  membershipType: string | null;
  paymentMethod: string | null;
  /** false = el Customer existe en QBO pero ninguna tienda de Mongo lo reclama */
  linked: boolean;

  balance: number;
  openInvoices: number;
  maxDaysOverdue: number;
  aging: QboAging;

  lastPayment: QboLastPayment | null;

  /** Pendiente según Mongo. null si la tienda no está vinculada. */
  mongoPending: number | null;
  /** balance(QBO) − mongoPending. null si no hay con qué comparar. */
  drift: number | null;
}

export interface QboTotals {
  /** Saldo neto: suma de Customer.Balance, ya descontados créditos sin aplicar. */
  balance: number;
  /** Suma de facturas abiertas. Es la base de la antigüedad y es ≥ balance. */
  invoiceTotal: number;
  /** invoiceTotal − balance. Créditos y pagos que el contador no aplicó a una factura. */
  unappliedCredits: number;
  /** Facturas abiertas con vencimiento pasado. Se calcula sobre invoiceTotal. */
  overdue: number;
  openInvoices: number;
  customers: number;
  linked: number;
  unlinked: number;
  withDrift: number;
  aging: QboAging;
}

export interface QboBalancesResponse {
  ok: boolean;
  totals: QboTotals;
  stores: QboBalanceRow[];
  /** El backend cachea 3 min: son 3 queries a QuickBooks y ~5 s en frío. */
  cached?: boolean;
  cachedAt?: string;
}

export interface QboInvoiceRow {
  qboId: string;
  docNumber: string | null;
  txnDate: string | null;
  dueDate: string | null;
  total: number;
  balance: number;
  paid: number;
  status: 'open' | 'partial' | 'paid';
  daysOverdue: number;
}

export interface QboPaymentRow {
  qboId: string;
  date: string | null;
  amount: number;
  note: string | null;
}

export type QboStoreDetail =
  | {
      ok: boolean;
      linked: true;
      storeId: string;
      storeName: string;
      qboCustomerId: string;
      balance: number;
      openInvoices: number;
      maxDaysOverdue: number;
      aging: QboAging;
      lastPayment: QboPaymentRow | null;
      invoices: QboInvoiceRow[];
      payments: QboPaymentRow[];
    }
  | {
      ok: boolean;
      linked: false;
      reason: 'not_linked' | 'store_not_found';
      storeId?: string;
      storeName?: string;
    };

export interface QboStatus {
  ok: boolean;
  connected: boolean;
  companyName?: string | null;
  realmId: string | null;
  env?: 'sandbox' | 'production';
  error?: string;
}

/** Candidato de QuickBooks para una tienda, con la evidencia que lo sostiene. */
export interface QboCandidate {
  qboCustomerId: string;
  qboName: string;
  balance: number;
  address: string;
  /** El número de calle coincide — es la señal fuerte. */
  streetHit: boolean;
  zipHit: boolean;
  /** 0–1. Similitud de la marca (texto antes del número). */
  brandSim: number;
  score: number;
}

export interface QboProposal {
  storeId: string;
  storeName: string;
  storeAddress: string;
  /** auto = vinculable sin revisar · review = empate o marca floja · none = ni la calle casa */
  confidence: 'auto' | 'review' | 'none';
  margin: number;
  /** El mejor candidato ya pertenece a otra tienda. */
  conflict: boolean;
  candidates: QboCandidate[];
}

export interface QboLinkResult {
  ok: boolean;
  dryRun: boolean;
  qboCustomers: number;
  summary: { total: number; auto: number; review: number; none: number };
  proposals: QboProposal[];
}

export interface QboCustomerRow {
  qboCustomerId: string;
  qboName: string;
  address: string;
  balance: number;
  linkedStoreId: string | null;
  linkedStoreName: string | null;
}

export interface QboCustomersResponse {
  ok: boolean;
  customers: QboCustomerRow[];
  total: number;
}

export interface QboSyncLedger {
  invoices: number;
  payments: number;
  invoicedTotal: number;
  paidTotal: number;
  pending: number;
}

export interface QboSyncPreview {
  ok: boolean;
  storeId: string;
  storeName: string;
  qboCustomerId: string;
  willDelete: QboSyncLedger;
  willImport: QboSyncLedger;
  sample: Array<{
    docNumber: string | null;
    txnDate: string | null;
    dueDate: string | null;
    total: number;
    balance: number;
    lines: Array<{ description: string | null; amount: number; kind: string; item: string | null }>;
  }>;
}

export interface QboSyncResult {
  ok: boolean;
  storeId: string;
  storeName: string;
  deleted: { invoices: number; payments: number };
  imported: { invoices: number; payments: number };
  unlinkedPayments: number;
}

export interface QboRetryResult {
  ok: boolean;
  invoices: { pushed: number; failed: number; skipped: number };
  payments: { pushed: number; failed: number; pending: number };
}

/* ══════════ API ══════════ */

const BASE = '/billing/invoices/qbo';

export const qboService = {
  status: async (): Promise<QboStatus> => {
    const { data } = await api.get(`${BASE}/status`);
    return data;
  },

  /** `force` salta el cache de 3 min del backend. Solo para el botón de actualizar. */
  balances: async (force = false): Promise<QboBalancesResponse> => {
    const { data } = await api.get(`${BASE}/balances${force ? '?force=1' : ''}`);
    return data;
  },

  storeDetail: async (storeId: string): Promise<QboStoreDetail> => {
    const { data } = await api.get(`${BASE}/stores/${storeId}`);
    return data;
  },

  /** Catálogo completo de QuickBooks, para elegir a mano. */
  customers: async (search = ''): Promise<QboCustomersResponse> => {
    const { data } = await api.get(`${BASE}/customers`, { params: search ? { search } : undefined });
    return data;
  },

  /** Sin `apply` solo reporta qué vincularía. Con apply=true escribe las de confianza 'auto'. */
  linkCustomers: async (apply = false, storeId?: string): Promise<QboLinkResult> => {
    const params = new URLSearchParams();
    if (apply) params.set('apply', '1');
    if (storeId) params.set('storeId', storeId);
    const qs = params.toString();
    const { data } = await api.post(`${BASE}/link-customers${qs ? `?${qs}` : ''}`);
    return data;
  },

  linkStore: async (storeId: string, qboCustomerId: string) => {
    const { data } = await api.post(`${BASE}/stores/${storeId}/link`, { qboCustomerId });
    return data;
  },

  unlinkStore: async (storeId: string) => {
    const { data } = await api.delete(`${BASE}/stores/${storeId}/link`);
    return data;
  },

  syncPreview: async (storeId: string): Promise<QboSyncPreview> => {
    const { data } = await api.get(`${BASE}/stores/${storeId}/sync-preview`);
    return data;
  },

  /** ⚠️ Borra las facturas y pagos de la tienda en Mongo y trae los de QuickBooks. */
  syncFromQbo: async (storeId: string): Promise<QboSyncResult> => {
    const { data } = await api.post(`${BASE}/stores/${storeId}/sync`, { confirm: true });
    return data;
  },

  retryPending: async (limit = 200): Promise<QboRetryResult> => {
    const { data } = await api.post(`${BASE}/retry-pending?limit=${limit}`);
    return data;
  },

  /** Guarda el refresh token del consentimiento inicial. Devuelve el status recalculado. */
  saveRefreshToken: async (refreshToken: string): Promise<QboStatus> => {
    const { data } = await api.post(`${BASE}/refresh-token`, { refreshToken });
    return data;
  },
};

/* ══════════ Query Keys ══════════ */

export const qboQK = {
  status: () => ['qbo', 'status'] as const,
  balances: () => ['qbo', 'balances'] as const,
  storeDetail: (storeId: string) => ['qbo', 'store', storeId] as const,
  customers: (search: string) => ['qbo', 'customers', search] as const,
  proposals: (storeId?: string) => ['qbo', 'proposals', storeId ?? 'all'] as const,
  syncPreview: (storeId: string) => ['qbo', 'sync-preview', storeId] as const,
};
